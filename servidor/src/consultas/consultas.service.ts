import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultaClinica } from './entities/consulta-clinica.entity';
import { CrearConsultaDto } from './dto/crear-consulta.dto';
import { ActualizarConsultaDto } from './dto/actualizar-consulta.dto';
import { GuardarExpedienteDto } from './dto/guardar-expediente.dto';
import { Cita } from '../citas/entities/cita.entity';
import { Paciente } from '../usuarios/entities/paciente.entity';
import { Medico } from '../medicos/entities/medico.entity';
import { EstadoCita } from '../common/enums';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

export interface HistorialExpedienteItemDto {
  citaID: number;
  inicio: Date;
  fin: Date;
  motivo: string | null;
  diagnostico: string | null;
}

@Injectable()
export class ConsultasService {
  constructor(
    @InjectRepository(ConsultaClinica)
    private readonly repo: Repository<ConsultaClinica>,
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
    @InjectRepository(Medico)
    private readonly medicoRepo: Repository<Medico>,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  private async sincronizarAntropometriaPaciente(
    pacienteId: number,
    pesoKg?: number,
    alturaM?: number,
  ): Promise<void> {
    if (pesoKg == null && alturaM == null) return;
    const paciente = await this.pacienteRepo.findOne({
      where: { pacienteID: pacienteId },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }
    if (pesoKg != null) paciente.pesoKg = pesoKg;
    if (alturaM != null) paciente.alturaM = alturaM;
    await this.pacienteRepo.save(paciente);
  }

  async obtenerPacienteParaMedico(
    _medicoId: number,
    pacienteId: number,
  ): Promise<Paciente> {
    const paciente = await this.pacienteRepo.findOne({
      where: { pacienteID: pacienteId },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }
    return paciente;
  }

  async historialExpedientePacienteMedico(
    medicoId: number,
    pacienteId: number,
  ): Promise<HistorialExpedienteItemDto[]> {
    await this.obtenerPacienteParaMedico(medicoId, pacienteId);

    const citas = await this.citaRepo.find({
      where: {
        medicoID: medicoId,
        pacienteID: pacienteId,
        estado: EstadoCita.COMPLETADA,
      },
      order: { inicio: 'DESC' },
    });

    if (citas.length === 0) {
      return [];
    }

    const consultas = await this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.cita', 'ci')
      .where('c.medicoID = :mid', { mid: medicoId })
      .andWhere('c.pacienteID = :pid', { pid: pacienteId })
      .getMany();

    const consultaPorCita = new Map<number, ConsultaClinica>();
    for (const co of consultas) {
      const citaId = co.cita?.citaID;
      if (citaId != null) {
        consultaPorCita.set(citaId, co);
      }
    }

    return citas.map((cita) => {
      const consulta = consultaPorCita.get(cita.citaID);
      const diagnostico = consulta?.diagnosticos?.trim() || null;
      const motivo =
        diagnostico ||
        consulta?.interrogatorio?.trim() ||
        consulta?.exploracionFisica?.trim() ||
        null;
      return {
        citaID: cita.citaID,
        inicio: cita.inicio,
        fin: cita.fin,
        motivo,
        diagnostico,
      };
    });
  }

  async listarPorMedico(
    medicoId: number,
    pacienteId?: number,
  ): Promise<ConsultaClinica[]> {
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.paciente', 'p')
      .where('c.medicoID = :mid', { mid: medicoId })
      .orderBy('c.fechaRegistro', 'DESC');
    if (pacienteId != null && !Number.isNaN(pacienteId)) {
      qb.andWhere('c.pacienteID = :pid', { pid: pacienteId });
    }
    return qb.getMany();
  }

  async listarResultadosPaciente(
    pacienteId: number,
    tipo: 'diagnostico' | 'laboratorio',
  ): Promise<ConsultaClinica[]> {
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.medico', 'm')
      .leftJoin('m.especialidad', 'e')
      .addSelect(['e.especialidadID', 'e.nombre'])
      .where('c.pacienteID = :pid', { pid: pacienteId })
      .orderBy('c.fechaRegistro', 'DESC');

    if (tipo === 'diagnostico') {
      qb.andWhere('c.diagnosticos IS NOT NULL AND c.diagnosticos <> :vacio', {
        vacio: '',
      });
    } else {
      qb.andWhere(
        'c.estudiosLaboratorio IS NOT NULL AND c.estudiosLaboratorio <> :vacio',
        { vacio: '' },
      );
    }

    return qb.getMany();
  }

  async obtenerResultadoPaciente(
    pacienteId: number,
    consultaId: number,
  ): Promise<ConsultaClinica> {
    const row = await this.repo.findOne({
      where: { consultaID: consultaId, paciente: { pacienteID: pacienteId } },
      relations: ['medico', 'medico.especialidad'],
    });
    if (!row) {
      throw new NotFoundException('Registro no encontrado');
    }
    return row;
  }

  async obtener(
    medicoId: number,
    consultaId: number,
  ): Promise<ConsultaClinica> {
    const row = await this.repo.findOne({
      where: {
        consultaID: consultaId,
        medico: { medicoID: medicoId },
      },
      relations: ['paciente', 'cita'],
    });
    if (!row) {
      throw new NotFoundException('Consulta no encontrada');
    }
    return row;
  }

  async guardarExpediente(
    medicoId: number,
    pacienteId: number,
    dto: GuardarExpedienteDto,
  ): Promise<{ paciente: Paciente; consulta: ConsultaClinica }> {
    await this.obtenerPacienteParaMedico(medicoId, pacienteId);
    await this.sincronizarAntropometriaPaciente(
      pacienteId,
      dto.pesoKg,
      dto.alturaM,
    );

    let consulta = await this.repo.findOne({
      where: {
        paciente: { pacienteID: pacienteId },
        medico: { medicoID: medicoId },
      },
      order: { fechaRegistro: 'DESC' },
    });

    if (!consulta) {
      consulta = this.repo.create({
        paciente: { pacienteID: pacienteId } as Paciente,
        medico: { medicoID: medicoId } as Medico,
        cita: null,
        identificacion: dto.identificacion?.trim() || null,
        antecedentes: dto.antecedentes?.trim() || null,
        tratamiento: dto.tratamiento?.trim() || null,
        pesoKg: dto.pesoKg,
        alturaM: dto.alturaM,
      });
    } else {
      if (dto.identificacion !== undefined) {
        consulta.identificacion = dto.identificacion.trim() || null;
      }
      if (dto.antecedentes !== undefined) {
        consulta.antecedentes = dto.antecedentes.trim() || null;
      }
      if (dto.tratamiento !== undefined) {
        consulta.tratamiento = dto.tratamiento.trim() || null;
      }
      consulta.pesoKg = dto.pesoKg;
      consulta.alturaM = dto.alturaM;
    }

    const consultaGuardada = await this.repo.save(consulta);
    const paciente = await this.pacienteRepo.findOneOrFail({
      where: { pacienteID: pacienteId },
    });
    return { paciente, consulta: consultaGuardada };
  }

  async crear(
    medicoId: number,
    dto: CrearConsultaDto,
  ): Promise<ConsultaClinica> {
    if (dto.citaID != null) {
      const cita = await this.citaRepo.findOne({
        where: {
          citaID: dto.citaID,
          medicoID: medicoId,
          pacienteID: dto.pacienteID,
        },
      });
      if (!cita) {
        throw new ForbiddenException(
          'La cita no corresponde a este médico o a este paciente',
        );
      }
    }

    if (dto.pesoKg == null || dto.alturaM == null) {
      throw new BadRequestException(
        'Peso y altura son obligatorios al registrar la consulta',
      );
    }

    await this.sincronizarAntropometriaPaciente(
      dto.pacienteID,
      dto.pesoKg,
      dto.alturaM,
    );

    const row = this.repo.create({
      paciente: { pacienteID: dto.pacienteID } as Paciente,
      medico: { medicoID: medicoId } as Medico,
      cita: dto.citaID != null ? { citaID: dto.citaID } : null,
      identificacion: dto.identificacion ?? null,
      antecedentes: dto.antecedentes ?? null,
      interrogatorio: dto.interrogatorio ?? null,
      exploracionFisica: dto.exploracionFisica ?? null,
      diagnosticos: dto.diagnosticos ?? null,
      tratamiento: dto.tratamiento ?? null,
      estudiosLaboratorio: dto.estudiosLaboratorio ?? null,
      evolucion: dto.evolucion ?? null,
      pronostico: dto.pronostico ?? null,
      notasConfidenciales: dto.notasConfidenciales ?? null,
      pesoKg: dto.pesoKg,
      alturaM: dto.alturaM,
    });
    const consultaGuardada = await this.repo.save(row);

    let citaCompletada: Cita | null = null;
    if (dto.citaID != null) {
      const cita = await this.citaRepo.findOne({
        where: {
          citaID: dto.citaID,
          medicoID: medicoId,
          pacienteID: dto.pacienteID,
        },
        relations: ['medico'],
      });
      if (
        cita &&
        (cita.estado === EstadoCita.CONFIRMADA ||
          cita.estado === EstadoCita.ANTICIPO_REALIZADO)
      ) {
        cita.estado = EstadoCita.COMPLETADA;
        citaCompletada = await this.citaRepo.save(cita);
      }
    }

    if (citaCompletada != null) {
      const medico = citaCompletada.medico ?? (await this.medicoRepo.findOne({
        where: { medicoID: citaCompletada.medicoID },
      }));
      const nombreMed = medico
        ? `${medico.nombre} ${medico.apellidoPat}`.trim()
        : 'tu médico';
      await this.notificacionesService.crear({
        pacienteID: dto.pacienteID,
        titulo: 'Califica tu consulta',
        mensaje: `¿Cómo fue tu visita con ${nombreMed}? Califica de 1 a 5 estrellas.`,
        tipo: 'CALIFICAR_MEDICO',
        citaID: citaCompletada.citaID,
        medicoID: citaCompletada.medicoID,
      });
    }

    return consultaGuardada;
  }

  async actualizar(
    medicoId: number,
    consultaId: number,
    dto: ActualizarConsultaDto,
  ): Promise<ConsultaClinica> {
    const row = await this.obtener(medicoId, consultaId);
    if (dto.pesoKg != null || dto.alturaM != null) {
      await this.sincronizarAntropometriaPaciente(
        row.paciente.pacienteID,
        dto.pesoKg ?? undefined,
        dto.alturaM ?? undefined,
      );
    }
    Object.assign(row, dto);
    return this.repo.save(row);
  }
}
