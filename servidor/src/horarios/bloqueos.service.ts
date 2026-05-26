import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BloqueoAgenda } from './entities/bloqueo-agenda.entity';
import { SlotAgenda } from './entities/slot-agenda.entity';
import { Medico } from '../medicos/entities/medico.entity';
import { EstadoCita, EstadoSlot } from '../common/enums';
import { HorariosService } from './horarios.service';
import { Cita } from '../citas/entities/cita.entity';
import { BloquearHorarioDto } from './dto/bloquear-horario.dto';

@Injectable()
export class BloqueosService {
  private readonly logger = new Logger(BloqueosService.name);

  constructor(
    @InjectRepository(BloqueoAgenda)
    private readonly repo: Repository<BloqueoAgenda>,
    @InjectRepository(SlotAgenda)
    private readonly slotRepo: Repository<SlotAgenda>,
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
    private readonly horariosService: HorariosService,
  ) {}

  async listar(medicoId: number): Promise<BloqueoAgenda[]> {
    return this.repo.find({
      where: { medico: { medicoID: medicoId } },
      relations: ['medico'],
      order: { inicio: 'DESC' },
    });
  }

  async crear(
    medicoId: number,
    dto: BloquearHorarioDto,
  ): Promise<BloqueoAgenda> {
    const inicio = new Date(dto.inicio);
    const fin = new Date(dto.fin);
    if (!(fin.getTime() > inicio.getTime())) {
      throw new BadRequestException(
        'La fecha/hora fin debe ser posterior al inicio',
      );
    }

    // Validación estricta: no permitir bloquear si hay citas agendadas que se traslapen.
    const citasSolapadas = await this.citaRepo
      .createQueryBuilder('c')
      .where('c.medicoID = :mid', { mid: medicoId })
      .andWhere('c.inicio < :fin AND c.fin > :ini', { ini: inicio, fin })
      .andWhere('c.estado IN (:...estados)', {
        estados: [
          EstadoCita.PENDIENTE_PAGO,
          EstadoCita.ANTICIPO_REALIZADO,
          EstadoCita.CONFIRMADA,
        ],
      })
      .getCount();

    if (citasSolapadas > 0) {
      throw new ConflictException(
        'Existen citas programadas en este rango de horario. Por favor, cancele o reubique estas citas primero para poder bloquear este horario',
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
    try {
      await this.horariosService.regenerarSlotsMedico(medicoId);
    } catch (err) {
      // FIX: El desbloqueo ya se aplicó; no devolvemos 500 por una regeneración secundaria.
      this.logger.warn(
        `No se pudieron regenerar slots tras eliminar bloqueo #${bloqueoId}: ${String(err)}`,
      );
    }
  }
}
