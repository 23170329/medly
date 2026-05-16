import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SlotAgenda } from './entities/slot-agenda.entity';
import { EstadoSlot } from '../common/enums';
import { Horario } from './entities/horario.entity';

@Injectable()
export class HorariosService {
  constructor(
    @InjectRepository(SlotAgenda)
    private readonly slotRepo: Repository<SlotAgenda>,

    @InjectRepository(Horario)
    private readonly horarioRepository: Repository<Horario>,
  ) {}

  /** Slots libres desde mañana hasta +30 días (filtrado por optional range). Excluye traslapes con bloqueo_agenda. */
  async disponiblesRangoQuery(params: {
    medicoId: number;
    sucursalId: number;
    desde?: Date;
    hasta?: Date;
  }): Promise<SlotAgenda[]> {
    const desde = params.desde ?? new Date();
    const hasta =
      params.hasta ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const qb = this.slotRepo
      .createQueryBuilder('s')
      .where('s.medicoID = :mid', { mid: params.medicoId })
      .andWhere('s.sucursalID = :sid', { sid: params.sucursalId })
      .andWhere('s.estado = :estado', { estado: EstadoSlot.LIBRE })
      .andWhere('s.inicio >= :desde', { desde })
      .andWhere('s.inicio <= :hasta', { hasta })
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM bloqueo_agenda b
          WHERE b."medicoID" = s."medicoID"
          AND b.inicio < s.fin AND b.fin > s.inicio
        )`,
      )
      .orderBy('s.inicio', 'ASC');

    return qb.getMany();
  }

  async crearHorario(datos: Partial<Horario>): Promise<Horario> {
    const nuevoHorario = this.horarioRepository.create(datos);
    return await this.horarioRepository.save(nuevoHorario);
  }

  async obtenerHorariosPorMedico(medicoId: number): Promise<Horario[]> {
    return await this.horarioRepository.find({
      where: { medico: { medicoID: medicoId } },
      relations: ['consultorio', 'consultorio.sucursal'] // Trae también la info del lugar
    });
  }
}
