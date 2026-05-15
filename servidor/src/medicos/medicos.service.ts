import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medico } from './entities/medico.entity';
import { Calificacion } from './entities/calificacion.entity';

@Injectable()
export class MedicosService {
  constructor(
    @InjectRepository(Medico)
    private readonly medicoRepository: Repository<Medico>,

    // Inyectamos el repositorio de calificaciones
    @InjectRepository(Calificacion)
    private readonly calificacionRepository: Repository<Calificacion>,
  ) {}

  // --- MÉTODOS DE MÉDICOS ---

  async crearMedico(datosMedico: Partial<Medico>): Promise<Medico> {
    const nuevoMedico = this.medicoRepository.create(datosMedico);
    return await this.medicoRepository.save(nuevoMedico);
  }

  async obtenerTodos(): Promise<Medico[]> {
    return await this.medicoRepository.find({ where: { estado: 'Activo' } });
  }

  async obtenerPorId(id: number): Promise<Medico | null> {
    return await this.medicoRepository.findOne({ where: { medicoID: id } });
  }

  // --- MÉTODOS DE CALIFICACIONES ---

  // Para registrar una nueva calificación en la BD Medly
  async calificarMedico(medicoId: number, estrellas: number, comentario: string): Promise<Calificacion> {
    const medico = await this.obtenerPorId(medicoId);
    
    if (!medico) {
      throw new NotFoundException('No se puede calificar a un médico que no existe.');
    }

    const nuevaCalificacion = this.calificacionRepository.create({
      medico,
      estrellas,
      comentario
    });

    return await this.calificacionRepository.save(nuevaCalificacion);
  }

  // Para mostrar las reseñas de un doctor en la app
  async obtenerResenasDeMedico(medicoId: number): Promise<Calificacion[]> {
    return await this.calificacionRepository.find({
      where: { medico: { medicoID: medicoId } },
      order: { fechaCalificacion: 'DESC' } // Mostramos las más recientes primero
    });
  }
}