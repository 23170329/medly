import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { SlotAgenda } from './entities/slot-agenda.entity';
import { Horario } from './entities/horario.entity';
import { BloqueoAgenda } from './entities/bloqueo-agenda.entity';
import { EstadoSlot } from '../common/enums';
import { Medico } from '../medicos/entities/medico.entity';
import { Consultorio } from '../sucursales/entities/consultorio.entity';
import { CrearHorarioDto } from './dto/crear-horario.dto';
import { ActualizarHorarioDto } from './dto/actualizar-horario.dto';

const DIAS_MAP: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

function normalizarDia(dia: string): string {
  return dia
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function diaSemanaANumero(dia: string): number {
  return DIAS_MAP[normalizarDia(dia)] ?? -1;
}

function horaStrToMin(h: string): number {
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + mm;
}

const SLOT_DURACION_MIN = 30;
const DIAS_LOOKAHEAD = 90;

@Injectable()
export class HorariosService {
  constructor(
    @InjectRepository(SlotAgenda)
    private readonly slotRepo: Repository<SlotAgenda>,

    @InjectRepository(Horario)
    private readonly horarioRepo: Repository<Horario>,

    @InjectRepository(BloqueoAgenda)
    private readonly bloqueoRepo: Repository<BloqueoAgenda>,
  ) {}

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

  async crearHorario(dto: CrearHorarioDto): Promise<Horario> {
    const medico = await this.slotRepo.manager.findOne(Medico, {
      where: { medicoID: dto.medicoID },
    });
    if (!medico) {
      throw new BadRequestException('Médico no encontrado');
    }
    const consultorio = await this.slotRepo.manager.findOne(Consultorio, {
      where: { consultorioID: dto.consultorioID },
      relations: ['sucursal'],
    });
    if (!consultorio) {
      throw new BadRequestException('Consultorio no encontrado');
    }
    if (diaSemanaANumero(dto.diaSemana) === -1) {
      throw new BadRequestException(
        `Día de semana inválido: "${dto.diaSemana}". Usa: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo`,
      );
    }
    if (horaStrToMin(dto.horaInicio) >= horaStrToMin(dto.horaFin)) {
      throw new BadRequestException('horaInicio debe ser anterior a horaFin');
    }

    const horario = this.horarioRepo.create({
      medico: { medicoID: dto.medicoID } as Medico,
      consultorio: { consultorioID: dto.consultorioID } as Consultorio,
      diaSemana: dto.diaSemana,
      horaInicio: dto.horaInicio,
      horaFin: dto.horaFin,
    });
    const saved = await this.horarioRepo.save(horario);
    await this.regenerarSlotsMedico(dto.medicoID);
    return saved;
  }

  async obtenerHorariosPorMedico(medicoId: number): Promise<Horario[]> {
    return this.horarioRepo.find({
      where: { medico: { medicoID: medicoId } },
      relations: ['consultorio', 'consultorio.sucursal'],
    });
  }

  async obtenerHorario(horarioId: number): Promise<Horario> {
    const h = await this.horarioRepo.findOne({
      where: { horarioID: horarioId },
      relations: ['medico', 'consultorio', 'consultorio.sucursal'],
    });
    if (!h) throw new NotFoundException('Horario no encontrado');
    return h;
  }

  async actualizarHorario(
    horarioId: number,
    dto: ActualizarHorarioDto,
  ): Promise<Horario> {
    const horario = await this.horarioRepo.findOne({
      where: { horarioID: horarioId },
      relations: ['medico'],
    });
    if (!horario) throw new NotFoundException('Horario no encontrado');

    if (dto.diaSemana != null && diaSemanaANumero(dto.diaSemana) === -1) {
      throw new BadRequestException(
        `Día de semana inválido: "${dto.diaSemana}"`,
      );
    }

    const hIni = dto.horaInicio ?? horario.horaInicio;
    const hFin = dto.horaFin ?? horario.horaFin;
    if (horaStrToMin(hIni) >= horaStrToMin(hFin)) {
      throw new BadRequestException('horaInicio debe ser anterior a horaFin');
    }

    if (dto.consultorioID != null) {
      const consultorio = await this.slotRepo.manager.findOne(Consultorio, {
        where: { consultorioID: dto.consultorioID },
      });
      if (!consultorio) {
        throw new BadRequestException('Consultorio no encontrado');
      }
      horario.consultorio = { consultorioID: dto.consultorioID } as Consultorio;
    }

    if (dto.diaSemana != null) horario.diaSemana = dto.diaSemana;
    if (dto.horaInicio != null) horario.horaInicio = dto.horaInicio;
    if (dto.horaFin != null) horario.horaFin = dto.horaFin;

    const saved = await this.horarioRepo.save(horario);
    await this.regenerarSlotsMedico(horario.medico.medicoID);
    return saved;
  }

  async eliminarHorario(horarioId: number): Promise<void> {
    const horario = await this.horarioRepo.findOne({
      where: { horarioID: horarioId },
      relations: ['medico'],
    });
    if (!horario) throw new NotFoundException('Horario no encontrado');

    const medicoID = horario.medico.medicoID;
    await this.horarioRepo.remove(horario);
    await this.regenerarSlotsMedico(medicoID);
  }

  async regenerarSlotsMedico(medicoId: number): Promise<number> {
    const horarios = await this.horarioRepo.find({
      where: { medico: { medicoID: medicoId } },
      relations: ['consultorio', 'consultorio.sucursal'],
    });

    await this.cleanupFutureLibreSlots(medicoId);

    if (horarios.length === 0) return 0;

    const desde = new Date();
    desde.setDate(desde.getDate() + 1);
    desde.setHours(0, 0, 0, 0);

    const hasta = new Date(desde);
    hasta.setDate(hasta.getDate() + DIAS_LOOKAHEAD);

    const bloqueos = await this.bloqueoRepo.find({
      where: {
        medico: { medicoID: medicoId } as Medico,
        inicio: LessThan(hasta),
        fin: MoreThan(desde),
      },
    });

    const slots: SlotAgenda[] = [];

    for (const horario of horarios) {
      const diaNum = diaSemanaANumero(horario.diaSemana);
      if (diaNum === -1) continue;

      const sucursalID = horario.consultorio.sucursal.sucursalID;
      const [hIni, mIni] = horario.horaInicio.split(':').map(Number);
      const [hFin, mFin] = horario.horaFin.split(':').map(Number);

      const current = new Date(desde);
      while (current <= hasta) {
        if (current.getDay() === diaNum) {
          const dayStart = new Date(current);
          dayStart.setHours(hIni, mIni, 0, 0);

          const dayEnd = new Date(current);
          dayEnd.setHours(hFin, mFin, 0, 0);

          const slotStart = new Date(dayStart);
          while (
            slotStart.getTime() + SLOT_DURACION_MIN * 60 * 1000 <=
            dayEnd.getTime()
          ) {
            const slotEnd = new Date(
              slotStart.getTime() + SLOT_DURACION_MIN * 60 * 1000,
            );

            const overlapsBloqueo = bloqueos.some(
              (b) => slotStart < b.fin && slotEnd > b.inicio,
            );
            if (!overlapsBloqueo) {
              slots.push(
                this.slotRepo.create({
                  medicoID: medicoId,
                  sucursalID,
                  consultorioID: horario.consultorio.consultorioID,
                  inicio: new Date(slotStart),
                  fin: new Date(slotEnd),
                  estado: EstadoSlot.LIBRE,
                }),
              );
            }

            slotStart.setMinutes(slotStart.getMinutes() + SLOT_DURACION_MIN);
          }
        }
        current.setDate(current.getDate() + 1);
      }
    }

    let creados = 0;
    const chunk = 200;
    for (let i = 0; i < slots.length; i += chunk) {
      const batch = slots.slice(i, i + chunk);
      const saved = await this.slotRepo.save(batch);
      creados += saved.length;
    }

    return creados;
  }

  private async cleanupFutureLibreSlots(medicoId: number): Promise<number> {
    const result = await this.slotRepo
      .createQueryBuilder()
      .delete()
      .from(SlotAgenda)
      .where('"medicoID" = :mid', { mid: medicoId })
      .andWhere('estado = :est', { est: EstadoSlot.LIBRE })
      .andWhere('inicio >= :now', { now: new Date() })
      .execute();
    return result.affected ?? 0;
  }
}
