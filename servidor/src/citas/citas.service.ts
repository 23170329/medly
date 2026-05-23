import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cita } from './entities/cita.entity';
import { SlotAgenda } from '../horarios/entities/slot-agenda.entity';
import { Medico } from '../medicos/entities/medico.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { EstadoCita, EstadoPago, EstadoSlot, TipoPago } from '../common/enums';
import { PagosService } from '../pagos/pagos.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { BloqueosService } from '../horarios/bloqueos.service';
import {
  CancelarCitaMedicoDto,
  etiquetaCausaCancelacion,
} from '../medico-panel/dto/cancelar-cita-medico.dto';

@Injectable()
export class CitasService {
  private readonly logger = new Logger(CitasService.name);

  constructor(
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
    @InjectRepository(SlotAgenda)
    private readonly slotRepo: Repository<SlotAgenda>,
    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,
    private readonly ds: DataSource,
    private readonly pagosService: PagosService,
    private readonly notificacionesService: NotificacionesService,
    private readonly auditoriaService: AuditoriaService,
    private readonly bloqueosService: BloqueosService,
  ) {}

  async crearReserva(pacienteId: number, slotID: number): Promise<Cita> {
    return this.ds.transaction(async (em) => {
      const slot = await em
        .getRepository(SlotAgenda)
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where('s.slotID = :id', { id: slotID })
        .getOne();

      if (!slot || slot.estado !== EstadoSlot.LIBRE) {
        throw new BadRequestException('El horario ya no está disponible');
      }

      const med = await em.findOne(Medico, {
        where: { medicoID: slot.medicoID },
      });
      if (!med) {
        throw new NotFoundException('Médico no encontrado');
      }

      const precio = parseFloat(String(med.precioConsulta));
      const anticipoNum = Math.round(precio * 0.5 * 100) / 100;
      const anticipo = anticipoNum.toFixed(2);
      const total = precio.toFixed(2);

      slot.estado = EstadoSlot.RESERVADO;
      await em.save(slot);

      const cita = em.create(Cita, {
        pacienteID: pacienteId,
        medicoID: slot.medicoID,
        sucursalID: slot.sucursalID,
        slotID: slot.slotID,
        inicio: slot.inicio,
        fin: slot.fin,
        estado: EstadoCita.PENDIENTE_PAGO,
        montoTotal: total,
        montoAnticipo: anticipo,
      });
      const saved = await em.save(cita);

      const pago = em.create(Pago, {
        citaID: saved.citaID,
        monto: anticipo,
        tipo: TipoPago.ANTICIPO_50,
        estado: EstadoPago.PENDIENTE,
      });
      await em.save(pago);

      return saved;
    });
  }

  async misCitas(pacienteId: number): Promise<Cita[]> {
    return this.citaRepo.find({
      where: { pacienteID: pacienteId },
      relations: ['medico', 'medico.especialidad', 'sucursal', 'slot', 'pagos'],
      order: { inicio: 'DESC' },
    });
  }

  async obtenerSiPaciente(citaId: number, pacienteId: number): Promise<Cita> {
    const c = await this.citaRepo.findOne({
      where: { citaID: citaId, pacienteID: pacienteId },
      relations: ['medico', 'medico.especialidad', 'sucursal', 'slot', 'pagos'],
    });
    if (!c) {
      throw new NotFoundException('Cita no encontrada');
    }
    return c;
  }

  async estadisticasPerfil(pacienteId: number): Promise<{
    total: number;
    completadas: number;
    proximas: number;
  }> {
    const raw = await this.citaRepo
      .createQueryBuilder('c')
      .select('COUNT(*)', 'total')
      .addSelect(
        `SUM(CASE WHEN c.estado = :comp THEN 1 ELSE 0 END)`,
        'completadas',
      )
      .addSelect(
        `SUM(CASE WHEN c.estado = :conf AND c.inicio > NOW() THEN 1 ELSE 0 END)`,
        'proximas',
      )
      .where('c.pacienteID = :pid', { pid: pacienteId })
      .setParameters({
        comp: EstadoCita.COMPLETADA,
        conf: EstadoCita.CONFIRMADA,
      })
      .getRawOne<{ total: string; completadas: string; proximas: string }>();

    return {
      total: parseInt(raw?.total ?? '0', 10),
      completadas: parseInt(raw?.completadas ?? '0', 10),
      proximas: parseInt(raw?.proximas ?? '0', 10),
    };
  }

  async abandonarPago(pacienteId: number, citaId: number): Promise<void> {
    const cita = await this.citaRepo.findOne({
      where: { citaID: citaId, pacienteID: pacienteId },
      relations: ['slot'],
    });
    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }
    if (
      cita.estado !== EstadoCita.PENDIENTE_PAGO &&
      cita.estado !== EstadoCita.ANTICIPO_REALIZADO
    ) {
      throw new BadRequestException('La cita no está pendiente de pago');
    }

    await this.ds.transaction(async (em) => {
      await em.delete(Pago, { citaID: citaId });
      await em.delete(Cita, { citaID: citaId });
      const slot = await em.findOne(SlotAgenda, {
        where: { slotID: cita.slotID },
      });
      if (slot) {
        slot.estado = EstadoSlot.LIBRE;
        await em.save(slot);
      }
    });
  }

  async cancelar(
    pacienteId: number,
    citaId: number,
  ): Promise<{
    mensaje: string;
    reembolsoProcesado: boolean;
  }> {
    const cita = await this.citaRepo.findOne({
      where: { citaID: citaId, pacienteID: pacienteId },
      relations: ['pagos', 'slot', 'medico', 'paciente'],
    });
    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }
    if (
      cita.estado !== EstadoCita.CONFIRMADA &&
      cita.estado !== EstadoCita.PENDIENTE_PAGO &&
      cita.estado !== EstadoCita.ANTICIPO_REALIZADO
    ) {
      throw new BadRequestException(
        'Solo se pueden cancelar citas confirmadas o pendientes de pago',
      );
    }

    if (
      cita.estado === EstadoCita.PENDIENTE_PAGO ||
      cita.estado === EstadoCita.ANTICIPO_REALIZADO
    ) {
      await this.notificarCancelacionReserva(cita, 'paciente');
      await this.abandonarPago(pacienteId, citaId);
      return {
        mensaje: 'Reserva cancelada. El horario quedó liberado.',
        reembolsoProcesado: false,
      };
    }

    const inicio = new Date(cita.inicio);
    const limite = new Date(inicio.getTime() - 24 * 60 * 60 * 1000);
    const ahora = new Date();
    const puedeReembolso = ahora < limite;

    let reembolsoProcesado = false;
    if (puedeReembolso) {
      reembolsoProcesado =
        await this.pagosService.reembolsarAnticipoSiAplica(cita);
    }

    cita.estado = EstadoCita.CANCELADA;
    await this.citaRepo.save(cita);

    const slot =
      cita.slot ??
      (await this.slotRepo.findOne({ where: { slotID: cita.slotID } }));
    if (slot) {
      slot.estado = EstadoSlot.LIBRE;
      await this.slotRepo.save(slot);
    }

    await this.notificarCancelacionPorPaciente(
      cita,
      puedeReembolso,
      reembolsoProcesado,
    );

    return {
      mensaje: puedeReembolso
        ? reembolsoProcesado
          ? 'Cita cancelada. El anticipo será reembolsado según tu banco.'
          : 'Cita cancelada. Hubo un problema al procesar el reembolso automático; contacta soporte.'
        : 'Cita cancelada. No aplica reembolso por política de menos de 24 horas.',
      reembolsoProcesado,
    };
  }

  async proximaCitaPaciente(pacienteId: number): Promise<Cita | null> {
    return this.citaRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.medico', 'm')
      .leftJoinAndSelect('m.especialidad', 'e')
      .leftJoinAndSelect('c.sucursal', 's')
      .leftJoinAndSelect('c.pagos', 'p')
      .where('c.pacienteID = :pid', { pid: pacienteId })
      .andWhere('c.estado IN (:...estados)', {
        estados: [
          EstadoCita.CONFIRMADA,
          EstadoCita.PENDIENTE_PAGO,
          EstadoCita.ANTICIPO_REALIZADO,
        ],
      })
      .andWhere('c.inicio >= :now', { now: new Date() })
      .orderBy('c.inicio', 'ASC')
      .getOne();
  }

  /** Cita confirmada en mostrador (anticipo registrado como pagado). */
  async crearCitaMostrador(pacienteId: number, slotID: number): Promise<Cita> {
    return this.ds.transaction(async (em) => {
      const slot = await em
        .getRepository(SlotAgenda)
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where('s.slotID = :id', { id: slotID })
        .getOne();

      if (!slot || slot.estado !== EstadoSlot.LIBRE) {
        throw new BadRequestException('El horario ya no está disponible');
      }

      const med = await em.findOne(Medico, {
        where: { medicoID: slot.medicoID },
      });
      if (!med) {
        throw new NotFoundException('Médico no encontrado');
      }

      const precio = parseFloat(String(med.precioConsulta));
      const anticipoNum = Math.round(precio * 0.5 * 100) / 100;
      const anticipo = anticipoNum.toFixed(2);
      const total = precio.toFixed(2);

      slot.estado = EstadoSlot.OCUPADO;
      await em.save(slot);

      const cita = em.create(Cita, {
        pacienteID: pacienteId,
        medicoID: slot.medicoID,
        sucursalID: slot.sucursalID,
        slotID: slot.slotID,
        inicio: slot.inicio,
        fin: slot.fin,
        estado: EstadoCita.ANTICIPO_REALIZADO,
        montoTotal: total,
        montoAnticipo: anticipo,
      });
      const saved = await em.save(cita);

      const pago = em.create(Pago, {
        citaID: saved.citaID,
        monto: anticipo,
        tipo: TipoPago.ANTICIPO_50,
        estado: EstadoPago.COMPLETADO,
      });
      await em.save(pago);

      return saved;
    });
  }

  /** Agenda de recepción; opcionalmente solo la sucursal asignada al staff. */
  async listarCitasRecepcion(
    sucursalId?: number | null,
    limite = 80,
  ): Promise<Cita[]> {
    const qb = this.citaRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.paciente', 'p')
      .leftJoinAndSelect('c.medico', 'm')
      .leftJoinAndSelect('m.especialidad', 'e')
      .leftJoinAndSelect('c.sucursal', 's')
      .where('c.inicio >= :ahora', { ahora: new Date() })
      .andWhere('c.estado IN (:...estados)', {
        estados: [
          EstadoCita.CONFIRMADA,
          EstadoCita.PENDIENTE_PAGO,
          EstadoCita.ANTICIPO_REALIZADO,
        ],
      });
    if (sucursalId != null) {
      qb.andWhere('c.sucursalID = :sid', { sid: sucursalId });
    }
    return qb.orderBy('c.inicio', 'ASC').take(limite).getMany();
  }

  async obtenerCitaRecepcion(
    citaId: number,
    sucursalId?: number | null,
  ): Promise<Cita> {
    const c = await this.citaRepo.findOne({
      where: { citaID: citaId },
      relations: [
        'paciente',
        'medico',
        'medico.especialidad',
        'sucursal',
        'slot',
        'pagos',
      ],
    });
    if (!c) {
      throw new NotFoundException('Cita no encontrada');
    }
    if (sucursalId != null && c.sucursalID !== sucursalId) {
      throw new NotFoundException('Cita no encontrada en tu sucursal');
    }
    return c;
  }

  async asegurarSlotEnSucursal(
    slotID: number,
    sucursalId: number | null,
  ): Promise<SlotAgenda> {
    const slot = await this.slotRepo.findOne({ where: { slotID } });
    if (!slot) {
      throw new NotFoundException('Horario no encontrado');
    }
    if (sucursalId != null && slot.sucursalID !== sucursalId) {
      throw new BadRequestException(
        'Este horario no pertenece a tu sucursal asignada',
      );
    }
    return slot;
  }

  async listarCitasMedico(medicoId: number): Promise<Cita[]> {
    return this.citaRepo.find({
      where: { medicoID: medicoId },
      relations: [
        'paciente',
        'sucursal',
        'slot',
        'medico',
        'medico.especialidad',
      ],
      order: { inicio: 'DESC' },
    });
  }

  async listarCitasPendientesAtencionMed(medicoId: number): Promise<Cita[]> {
    return this.citaRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.paciente', 'p')
      .leftJoinAndSelect('c.sucursal', 's')
      .leftJoinAndSelect('c.medico', 'm')
      .leftJoinAndSelect('m.especialidad', 'e')
      .where('c.medicoID = :mid', { mid: medicoId })
      .andWhere('c.estado IN (:...estados)', {
        estados: [
          EstadoCita.CONFIRMADA,
          EstadoCita.ANTICIPO_REALIZADO,
          EstadoCita.PENDIENTE_PAGO,
        ],
      })
      .andWhere('c.inicio >= :ahora', { ahora: new Date() })
      .orderBy('c.inicio', 'ASC')
      .getMany();
  }

  private formatearFechaCita(inicio: Date): string {
    return new Date(inicio).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private nombreMedico(cita: Cita): string {
    return cita.medico
      ? `${cita.medico.nombre} ${cita.medico.apellidoPat}`
      : 'Médico';
  }

  private nombrePaciente(cita: Cita): string {
    if (!cita.paciente) return 'Paciente';
    const p = cita.paciente;
    const apMat = p.apellido_mat ? ` ${p.apellido_mat}` : '';
    return `${p.nombre} ${p.apellido_pat}${apMat}`.trim();
  }

  private async notificarCancelacionReserva(
    cita: Cita,
    quien: 'paciente' | 'medico',
  ): Promise<void> {
    const fechaStr = this.formatearFechaCita(cita.inicio);
    const nombreMed = this.nombreMedico(cita);
    const nombrePac = this.nombrePaciente(cita);

    try {
      if (quien === 'paciente') {
        await this.notificacionesService.crear({
          pacienteID: cita.pacienteID,
          titulo: 'Reserva cancelada',
          mensaje: `Cancelaste tu reserva con ${nombreMed} del ${fechaStr}. Puedes agendar una nueva cita cuando quieras.`,
          tipo: 'CITA_CANCELADA',
          citaID: cita.citaID,
          permiteReagendar: true,
        });
        await this.notificacionesService.crearParaMedico({
          medicoID: cita.medicoID,
          titulo: 'Reserva cancelada por el paciente',
          mensaje: `${nombrePac} canceló la reserva del ${fechaStr} antes de completar el pago.`,
          tipo: 'CITA_CANCELADA',
          citaID: cita.citaID,
          permiteReagendar: true,
        });
      } else {
        await this.notificacionesService.crear({
          pacienteID: cita.pacienteID,
          titulo: 'Reserva cancelada por el médico',
          mensaje: `${nombreMed} canceló tu reserva del ${fechaStr}. Puedes agendar otra cita.`,
          tipo: 'CITA_CANCELADA',
          citaID: cita.citaID,
          permiteReagendar: true,
        });
        await this.notificacionesService.crearParaMedico({
          medicoID: cita.medicoID,
          titulo: 'Reserva cancelada',
          mensaje: `Cancelaste la reserva de ${nombrePac} del ${fechaStr}.`,
          tipo: 'CITA_CANCELADA',
          citaID: cita.citaID,
          permiteReagendar: true,
        });
      }
    } catch {
      this.logger.warn('No se pudieron crear notificaciones de reserva cancelada');
    }
  }

  private async notificarCancelacionPorPaciente(
    cita: Cita,
    puedeReembolso: boolean,
    reembolsoProcesado: boolean,
  ): Promise<void> {
    const fechaStr = this.formatearFechaCita(cita.inicio);
    const nombreMed = this.nombreMedico(cita);
    const nombrePac = this.nombrePaciente(cita);

    const msgReembolsoPac = puedeReembolso
      ? reembolsoProcesado
        ? ' El anticipo será reembolsado según tu banco.'
        : ' Hubo un problema al procesar el reembolso; contacta soporte.'
      : ' No aplica reembolso por cancelar con menos de 24 horas de anticipación.';

    const msgReembolsoMed = puedeReembolso
      ? reembolsoProcesado
        ? ' Se procesará el reembolso del anticipo al paciente.'
        : ' Revisa el reembolso del anticipo con administración.'
      : ' No aplica reembolso (menos de 24 h).';

    try {
      await this.notificacionesService.crear({
        pacienteID: cita.pacienteID,
        titulo: 'Cita cancelada',
        mensaje: `Cancelaste tu cita con ${nombreMed} del ${fechaStr}.${msgReembolsoPac} Puedes reagendar cuando quieras.`,
        tipo: 'CITA_CANCELADA',
        citaID: cita.citaID,
        permiteReagendar: true,
      });
      await this.notificacionesService.crearParaMedico({
        medicoID: cita.medicoID,
        titulo: 'Cita cancelada por el paciente',
        mensaje: `${nombrePac} canceló la cita del ${fechaStr}.${msgReembolsoMed}`,
        tipo: 'CITA_CANCELADA',
        citaID: cita.citaID,
        permiteReagendar: true,
      });
    } catch {
      this.logger.warn('No se pudieron crear notificaciones de cancelación');
    }
  }

  private async bloquearHorarioCancelado(
    cita: Cita,
    motivo: string,
  ): Promise<void> {
    try {
      await this.bloqueosService.crear(cita.medicoID, {
        inicio: new Date(cita.inicio).toISOString(),
        fin: new Date(cita.fin).toISOString(),
        motivo: `Horario cancelado: ${motivo}`.slice(0, 240),
      });
    } catch (err) {
      this.logger.warn(
        `No se pudo bloquear horario tras cancelación: ${String(err)}`,
      );
    }
  }

  private async notificarCancelacionPorMedico(
    cita: Cita,
    cancelacion: CancelarCitaMedicoDto,
    reembolsoProcesado: boolean,
  ): Promise<void> {
    const fechaStr = this.formatearFechaCita(cita.inicio);
    const nombreMed = this.nombreMedico(cita);
    const nombrePac = this.nombrePaciente(cita);
    const causa = etiquetaCausaCancelacion(cancelacion.causa);

    const msgReembolso =
      reembolsoProcesado
        ? ' El anticipo será reembolsado según tu banco.'
        : ' Revisa el reembolso del anticipo con administración si aplicaba pago.';

    try {
      await this.notificacionesService.crear({
        pacienteID: cita.pacienteID,
        titulo: 'Cita cancelada por el médico',
        mensaje: `Tu cita con ${nombreMed} del ${fechaStr} fue cancelada. Causa: ${causa}. Motivo: ${cancelacion.motivo}.${msgReembolso} Toca Reagendar para elegir otro horario con el mismo médico.`,
        tipo: 'CITA_CANCELADA',
        medicoID: cita.medicoID,
        sucursalID: cita.sucursalID,
        permiteReagendar: true,
      });
      await this.notificacionesService.crearParaMedico({
        medicoID: cita.medicoID,
        titulo: 'Cita cancelada',
        mensaje: `Cancelaste la cita de ${nombrePac} del ${fechaStr}. Causa: ${causa}. Motivo: ${cancelacion.motivo}.`,
        tipo: 'CITA_CANCELADA',
        citaID: cita.citaID,
        permiteReagendar: true,
      });
    } catch {
      this.logger.warn('No se pudo crear notificación de cancelación');
    }
  }

  async cancelarPorMedico(
    medicoId: number,
    citaId: number,
    cancelacion: CancelarCitaMedicoDto,
  ): Promise<{ mensaje: string; reembolsoProcesado: boolean }> {
    const cita = await this.citaRepo.findOne({
      where: { citaID: citaId, medicoID: medicoId },
      relations: ['pagos', 'slot', 'medico', 'paciente'],
    });
    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }
    if (
      cita.estado !== EstadoCita.CONFIRMADA &&
      cita.estado !== EstadoCita.PENDIENTE_PAGO &&
      cita.estado !== EstadoCita.ANTICIPO_REALIZADO
    ) {
      throw new BadRequestException(
        'Solo se pueden cancelar citas confirmadas o pendientes de pago',
      );
    }

    if (
      cita.estado === EstadoCita.PENDIENTE_PAGO ||
      cita.estado === EstadoCita.ANTICIPO_REALIZADO
    ) {
      const inicio = cita.inicio;
      const fin = cita.fin;
      const medicoID = cita.medicoID;
      const sucursalID = cita.sucursalID;
      const pacienteID = cita.pacienteID;
      await this.abandonarPago(cita.pacienteID, citaId);
      await this.bloqueosService.crear(medicoID, {
        inicio: new Date(inicio).toISOString(),
        fin: new Date(fin).toISOString(),
        motivo: `Cancelación médica de reserva: ${cancelacion.motivo}`.slice(
          0,
          240,
        ),
      });
      await this.notificacionesService.crear({
        pacienteID,
        titulo: 'Cita cancelada por el médico',
        mensaje: `El médico canceló tu reserva. Motivo: ${cancelacion.motivo}. Puedes reagendar con el mismo médico en otro horario.`,
        tipo: 'CITA_CANCELADA',
        medicoID,
        sucursalID,
        permiteReagendar: true,
      });
      await this.notificacionesService.crearParaMedico({
        medicoID,
        titulo: 'Reserva cancelada',
        mensaje: `Cancelaste la reserva de ${this.nombrePaciente(cita)}.`,
        tipo: 'CITA_CANCELADA',
        permiteReagendar: true,
      });
      return {
        mensaje: 'Reserva cancelada por el médico. El horario quedó bloqueado.',
        reembolsoProcesado: false,
      };
    }

    const reembolsoProcesado =
      await this.pagosService.reembolsarAnticipoSiAplica(cita);

    cita.estado = EstadoCita.CANCELADA;
    cita.causaCancelacion = cancelacion.causa;
    cita.motivoCancelacion = cancelacion.motivo;
    await this.citaRepo.save(cita);

    const slot =
      cita.slot ??
      (await this.slotRepo.findOne({ where: { slotID: cita.slotID } }));
    if (slot) {
      slot.estado = EstadoSlot.LIBRE;
      await this.slotRepo.save(slot);
    }

    await this.bloquearHorarioCancelado(cita, cancelacion.motivo);

    await this.notificarCancelacionPorMedico(
      cita,
      cancelacion,
      reembolsoProcesado,
    );

    return {
      mensaje: reembolsoProcesado
        ? 'Cita cancelada. Reembolso de anticipo en proceso si aplica.'
        : 'Cita cancelada. Revisa el reembolso del anticipo con administración.',
      reembolsoProcesado,
    };
  }
}
