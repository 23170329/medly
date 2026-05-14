import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultaClinica } from './entities/consulta-clinica.entity';
import { CrearConsultaDto } from './dto/crear-consulta.dto';
import { ActualizarConsultaDto } from './dto/actualizar-consulta.dto';
import { Cita } from '../citas/entities/cita.entity';
import { Paciente } from '../usuarios/entities/paciente.entity';
import { Medico } from '../medicos/entities/medico.entity';

@Injectable()
export class ConsultasService {
  constructor(
    @InjectRepository(ConsultaClinica)
    private readonly repo: Repository<ConsultaClinica>,
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
  ) {}

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

  async obtener(medicoId: number, consultaId: number): Promise<ConsultaClinica> {
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

  async crear(medicoId: number, dto: CrearConsultaDto): Promise<ConsultaClinica> {
    if (dto.citaID != null) {
      const cita = await this.citaRepo.findOne({
        where: { citaID: dto.citaID, medicoID: medicoId, pacienteID: dto.pacienteID },
      });
      if (!cita) {
        throw new ForbiddenException(
          'La cita no corresponde a este médico o a este paciente',
        );
      }
    }

    const row = this.repo.create({
      paciente: { pacienteID: dto.pacienteID } as Paciente,
      medico: { medicoID: medicoId } as Medico,
      cita:
        dto.citaID != null ? ({ citaID: dto.citaID } as Cita) : null,
      identificacion: dto.identificacion ?? null,
      antecedentes: dto.antecedentes ?? null,
      interrogatorio: dto.interrogatorio ?? null,
      exploracionFisica: dto.exploracionFisica ?? null,
      diagnosticos: dto.diagnosticos ?? null,
      tratamiento: dto.tratamiento ?? null,
      evolucion: dto.evolucion ?? null,
      pronostico: dto.pronostico ?? null,
      notasConfidenciales: dto.notasConfidenciales ?? null,
    });
    return this.repo.save(row);
  }

  async actualizar(
    medicoId: number,
    consultaId: number,
    dto: ActualizarConsultaDto,
  ): Promise<ConsultaClinica> {
    const row = await this.obtener(medicoId, consultaId);
    Object.assign(row, dto);
    return this.repo.save(row);
  }
}
