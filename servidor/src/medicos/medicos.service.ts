import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medico } from './entities/medico.entity';
import { MedicoSucursal } from './entities/medico-sucursal.entity';

@Injectable()
export class MedicosService {
  constructor(
    @InjectRepository(Medico)
    private readonly medicoRepo: Repository<Medico>,
    @InjectRepository(MedicoSucursal)
    private readonly msRepo: Repository<MedicoSucursal>,
  ) {}

  async listar(params: {
    especialidadId?: number;
    sucursalId?: number;
    q?: string;
  }): Promise<Medico[]> {
    const qb = this.medicoRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.especialidad', 'e');

    if (params.especialidadId) {
      qb.andWhere('m.especialidadID = :eid', {
        eid: params.especialidadId,
      });
    }

    if (params.sucursalId) {
      qb.innerJoin('m.sucursales', 'ms')
        .andWhere('ms.sucursalID = :sid', { sid: params.sucursalId })
        .distinct(true);
    }

    if (params.q?.trim()) {
      const term = `%${params.q.trim().toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(m.nombre) LIKE :term OR LOWER(m.apellidoPat) LIKE :term OR LOWER(CONCAT(m.nombre, ' ', m.apellidoPat)) LIKE :term)`,
        { term },
      );
    }

    qb.orderBy('m.apellidoPat', 'ASC').addOrderBy('m.nombre', 'ASC');

    return qb.getMany();
  }

  async obtener(id: number): Promise<Medico | null> {
    return this.medicoRepo.findOne({
      where: { medicoID: id },
      relations: ['especialidad', 'sucursales', 'sucursales.sucursal'],
    });
  }

  async sucursalesDeMedico(medicoId: number): Promise<MedicoSucursal[]> {
    return this.msRepo.find({
      where: { medicoID: medicoId },
      relations: ['sucursal'],
    });
  }
}
