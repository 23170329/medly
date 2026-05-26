import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calificacion } from './entities/calificacion.entity';
import { Medico } from './entities/medico.entity';
import { Cita } from '../citas/entities/cita.entity';
import { CrearCalificacionDto } from './dto/crear-calificacion.dto';
import { EstadoCita } from '../common/enums';

@Injectable()
export class CalificacionesService {
  constructor(
    @InjectRepository(Calificacion)
    private readonly calificacionRepo: Repository<Calificacion>,
    @InjectRepository(Medico)
    private readonly medicoRepo: Repository<Medico>,
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
  ) {}

  private async actualizarPromedioMedico(medicoId: number): Promise<void> {
    const rows = await this.calificacionRepo.find({
      where: { medicoID: medicoId },
      select: ['estrellas'],
    });
    const total = rows.length;
    const suma = rows.reduce((acc, r) => acc + r.estrellas, 0);
    const promedio = total > 0 ? suma / total : 0;
    await this.medicoRepo.update(medicoId, {
      promedioCalificacion: promedio.toFixed(2),
      totalResenas: total,
    });
  }

  async crear(
    pacienteId: number,
    dto: CrearCalificacionDto,
  ): Promise<Calificacion> {
    const cita = await this.citaRepo.findOne({
      where: {
        citaID: dto.citaID,
        pacienteID: pacienteId,
        estado: EstadoCita.COMPLETADA,
      },
      relations: ['medico'],
    });
    if (!cita) {
      throw new NotFoundException(
        'Cita completada no encontrada para este paciente',
      );
    }

    const existente = await this.calificacionRepo.findOne({
      where: { citaID: dto.citaID },
    });
    if (existente) {
      throw new ConflictException('Esta cita ya fue calificada');
    }

    const calificacion = this.calificacionRepo.create({
      pacienteID: pacienteId,
      medicoID: cita.medicoID,
      citaID: cita.citaID,
      estrellas: dto.estrellas,
      comentario: dto.comentario?.trim() || null,
    });
    const guardada = await this.calificacionRepo.save(calificacion);
    await this.actualizarPromedioMedico(cita.medicoID);
    return guardada;
  }

  async listarPorMedico(medicoId: number): Promise<Calificacion[]> {
    const medico = await this.medicoRepo.findOne({
      where: { medicoID: medicoId },
      select: ['medicoID'],
    });
    if (!medico) {
      throw new NotFoundException('Médico no encontrado');
    }
    return this.calificacionRepo.find({
      where: { medicoID: medicoId },
      relations: ['paciente'],
      order: { fechaCalificacion: 'DESC' },
      take: 100,
    });
  }

  async yaCalificada(pacienteId: number, citaId: number): Promise<boolean> {
    const cita = await this.citaRepo.findOne({
      where: {
        citaID: citaId,
        pacienteID: pacienteId,
        estado: EstadoCita.COMPLETADA,
      },
    });
    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }
    const row = await this.calificacionRepo.findOne({
      where: { citaID: citaId },
    });
    return row != null;
  }
}
