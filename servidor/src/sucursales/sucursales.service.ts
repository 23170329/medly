import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sucursal } from './entities/sucursal.entity';

@Injectable()
export class SucursalesService {
  constructor(
    @InjectRepository(Sucursal)
    private readonly repo: Repository<Sucursal>,
  ) {}

  async listar(): Promise<Sucursal[]> {
    return this.repo.find({ order: { nombre: 'ASC' } });
  }

  async obtener(id: number): Promise<Sucursal | null> {
    return this.repo.findOne({ where: { sucursalID: id } });
  }
}
