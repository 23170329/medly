import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Especialidad } from './entities/especialidad.entity';

@Injectable()
export class EspecialidadesService {
  constructor(
    @InjectRepository(Especialidad)
    private readonly repo: Repository<Especialidad>,
  ) {}

  async listar(): Promise<Especialidad[]> {
    return this.repo.find({ order: { nombre: 'ASC' } });
  }
}
