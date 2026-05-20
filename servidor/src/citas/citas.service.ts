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
    if (cita.estado !== EstadoCita.PENDIENTE_PAGO) {
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
      relations: ['pagos', 'slot'],
    });
    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }
    if (
      cita.estado !== EstadoCita.CONFIRMADA &&
      cita.estado !== EstadoCita.PENDIENTE_PAGO
    ) {
      throw new BadRequestException(
        'Solo se pueden cancelar citas confirmadas o pendientes de pago',
      );
    }

    if (cita.estado === EstadoCita.PENDIENTE_PAGO) {
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
      .andWhere('c.estado = :est', { est: EstadoCita.CONFIRMADA })
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
        estado: EstadoCita.CONFIRMADA,
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
      .where('c.medicoID = :mid', { mid: medicoId })
      .andWhere('c.estado = :est', { est: EstadoCita.CONFIRMADA })
      .andWhere('c.inicio >= :ahora', { ahora: new Date() })
      .orderBy('c.inicio', 'ASC')
      .getMany();
  }

  async cancelarPorMedico(
    medicoId: number,
    citaId: number,
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
      cita.estado !== EstadoCita.PENDIENTE_PAGO
    ) {
      throw new BadRequestException(
        'Solo se pueden cancelar citas confirmadas o pendientes de pago',
      );
    }

    if (cita.estado === EstadoCita.PENDIENTE_PAGO) {
      await this.abandonarPago(cita.pacienteID, citaId);
      return {
        mensaje: 'Reserva cancelada por el médico. El horario quedó liberado.',
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

    try {
      const nombreMedico = cita.medico
        ? `${cita.medico.nombre} ${cita.medico.apellidoPat}`
        : 'Médico';
      const fechaStr = cita.inicio
        ? new Date(cita.inicio).toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';
      await this.notificacionesService.crear({
        pacienteID: cita.pacienteID,
        titulo: 'Cita cancelada',
        mensaje: `Tu cita con ${nombreMedico} del ${fechaStr} ha sido cancelada por el médico.`,
      });
    } catch {
      this.logger.warn('No se pudo crear notificación de cancelación');
    }

    return {
      mensaje: puedeReembolso
        ? reembolsoProcesado
          ? 'Cita cancelada. Reembolso de anticipo en proceso si aplica.'
          : 'Cita cancelada. Revisa el reembolso del anticipo con administración.'
        : 'Cita cancelada. No aplica reembolso por política de menos de 24 horas.',
      reembolsoProcesado,
    };
  }
}
