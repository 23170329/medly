import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BloqueoAgenda } from './entities/bloqueo-agenda.entity';
import { SlotAgenda } from './entities/slot-agenda.entity';
import { Medico } from '../medicos/entities/medico.entity';
import { EstadoSlot } from '../common/enums';
import { HorariosService } from './horarios.service';

export interface CrearBloqueoDto {
  inicio: string;
  fin: string;
  motivo?: string;
}

@Injectable()
export class BloqueosService {
  constructor(
    @InjectRepository(BloqueoAgenda)
    private readonly repo: Repository<BloqueoAgenda>,
    @InjectRepository(SlotAgenda)
    private readonly slotRepo: Repository<SlotAgenda>,
    private readonly horariosService: HorariosService,
  ) {}

  async listar(medicoId: number): Promise<BloqueoAgenda[]> {
    return this.repo.find({
      where: { medico: { medicoID: medicoId } },
      relations: ['medico'],
      order: { inicio: 'DESC' },
    });
  }

  async crear(medicoId: number, dto: CrearBloqueoDto): Promise<BloqueoAgenda> {
    const inicio = new Date(dto.inicio);
    const fin = new Date(dto.fin);
    if (!(fin.getTime() > inicio.getTime())) {
      throw new BadRequestException(
        'La fecha/hora fin debe ser posterior al inicio',
      );
    }
    const solapa = await this.repo
      .createQueryBuilder('b')
      .where('b.medicoID = :mid', { mid: medicoId })
      .andWhere('b.inicio < :fin AND b.fin > :ini', { ini: inicio, fin })
      .getCount();
    if (solapa > 0) {
      throw new BadRequestException(
        'El bloqueo se traslapa con otro existente',
      );
    }
    const row = this.repo.create({
      medico: { medicoID: medicoId } as Medico,
      inicio,
      fin,
      motivo: dto.motivo?.trim() || null,
    });
    const saved = await this.repo.save(row);

    await this.slotRepo
      .createQueryBuilder()
      .delete()
      .from(SlotAgenda)
      .where('"medicoID" = :mid', { mid: medicoId })
      .andWhere('estado = :est', { est: EstadoSlot.LIBRE })
      .andWhere('inicio < :finVal AND fin > :iniVal', {
        iniVal: inicio,
        finVal: fin,
      })
      .execute();

    return saved;
  }

  async eliminar(medicoId: number, bloqueoId: number): Promise<void> {
    const r = await this.repo
      .createQueryBuilder()
      .delete()
      .from(BloqueoAgenda)
      .where('bloqueoID = :id', { id: bloqueoId })
      .andWhere('"medicoID" = :mid', { mid: medicoId })
      .execute();
    if (!r.affected) {
      throw new NotFoundException('Bloqueo no encontrado');
    }
    await this.horariosService.regenerarSlotsMedico(medicoId);
  }
}
