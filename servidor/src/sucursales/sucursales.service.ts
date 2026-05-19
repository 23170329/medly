import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sucursal } from './entities/sucursal.entity';
import { Consultorio } from './entities/consultorio.entity';

@Injectable()
export class SucursalesService {
  constructor(
    @InjectRepository(Sucursal)
    private readonly sucursalRepository: Repository<Sucursal>,

    @InjectRepository(Consultorio)
    private readonly consultorioRepository: Repository<Consultorio>,
  ) {}

  // 1. Registrar una nueva sucursal
  async crearSucursal(datos: Partial<Sucursal>): Promise<Sucursal> {
    const nuevaSucursal = this.sucursalRepository.create(datos);
    return await this.sucursalRepository.save(nuevaSucursal);
  }

  // 2. Obtener todas las sucursales activas (Para los dropdowns de la App)
  async obtenerActivas(): Promise<Sucursal[]> {
    return await this.sucursalRepository.find({
      where: { estado: 'Activa' },
      order: { nombre: 'ASC' },
    });
  }

  // 3. Buscar sucursal por ID
  async obtenerPorId(id: number): Promise<Sucursal> {
    const sucursal = await this.sucursalRepository.findOne({
      where: { sucursalID: id },
    });
    if (!sucursal) {
      throw new NotFoundException(`La sucursal con ID ${id} no existe.`);
    }
    return sucursal;
  }

  async desactivarSucursal(id: number): Promise<Sucursal> {
    const sucursal = await this.obtenerPorId(id);
    sucursal.estado = 'Inactiva';
    return await this.sucursalRepository.save(sucursal);
  }

  async crearConsultorio(
    sucursalId: number,
    numero: string,
  ): Promise<Consultorio> {
    const sucursal = await this.sucursalRepository.findOne({
      where: { sucursalID: sucursalId },
    });

    if (!sucursal) {
      throw new NotFoundException(
        `No se puede crear el consultorio porque la sucursal con ID ${sucursalId} no existe.`,
      );
    }

    const nuevoConsultorio = this.consultorioRepository.create({
      numeroConsultorio: numero,
      sucursal: sucursal,
    });

    return await this.consultorioRepository.save(nuevoConsultorio);
  }

  // 2. Obtener todos los consultorios de una sucursal específica (Muy útil para la app)
  async obtenerConsultoriosPorSucursal(
    sucursalId: number,
  ): Promise<Consultorio[]> {
    return await this.consultorioRepository.find({
      where: { sucursal: { sucursalID: sucursalId } },
      order: { numeroConsultorio: 'ASC' },
    });
  }
}
