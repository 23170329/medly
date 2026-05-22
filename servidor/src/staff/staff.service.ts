import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CuentaStaff } from './entities/cuenta-staff.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(CuentaStaff)
    private readonly staffRepo: Repository<CuentaStaff>,
  ) {}

  async obtenerRecepcionista(staffId: number): Promise<CuentaStaff> {
    const s = await this.staffRepo.findOne({
      where: { cuentaStaffID: staffId, rol: 'RECEPCIONISTA' },
      relations: ['sucursal'],
    });
    if (!s) {
      throw new NotFoundException('Recepcionista no encontrado');
    }
    return s;
  }
}
