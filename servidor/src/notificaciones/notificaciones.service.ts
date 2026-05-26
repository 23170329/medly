import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { NotificacionMedico } from './entities/notificacion-medico.entity';
import { Cita } from '../citas/entities/cita.entity';
import { CAUSAS_CANCELACION_MEDICO } from '../medico-panel/dto/cancelar-cita-medico.dto';

export type NotificacionPacienteDto = Notificacion & {
  motivoCancelacion?: string | null;
  canceladaPorMedico?: boolean;
};

export interface CrearNotificacionParams {
  titulo: string;
  mensaje: string;
  tipo?: string;
  citaID?: number;
  medicoID?: number;
  sucursalID?: number;
  permiteReagendar?: boolean;
}

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notifRepo: Repository<Notificacion>,
    @InjectRepository(NotificacionMedico)
    private readonly notifMedicoRepo: Repository<NotificacionMedico>,
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
  ) {}

  async crear(
    params: CrearNotificacionParams & { pacienteID: number },
  ): Promise<Notificacion> {
    const notif = this.notifRepo.create({
      pacienteID: params.pacienteID,
      titulo: params.titulo,
      mensaje: params.mensaje,
      tipo: params.tipo ?? null,
      citaID: params.citaID ?? null,
      medicoID: params.medicoID ?? null,
      sucursalID: params.sucursalID ?? null,
      permiteReagendar: params.permiteReagendar ?? false,
    });
    return this.notifRepo.save(notif);
  }

  async crearParaMedico(
    params: CrearNotificacionParams & { medicoID: number },
  ): Promise<NotificacionMedico> {
    const notif = this.notifMedicoRepo.create({
      medicoID: params.medicoID,
      titulo: params.titulo,
      mensaje: params.mensaje,
      tipo: params.tipo ?? null,
      citaID: params.citaID ?? null,
      permiteReagendar: params.permiteReagendar ?? false,
    });
    return this.notifMedicoRepo.save(notif);
  }

  async listarPorPaciente(
    pacienteID: number,
  ): Promise<NotificacionPacienteDto[]> {
    const lista = await this.notifRepo.find({
      where: { pacienteID },
      order: { fechaCreacion: 'DESC' },
      take: 50,
    });

    const citaIds = [
      ...new Set(
        lista
          .filter((n) => n.citaID != null && n.tipo === 'CITA_CANCELADA')
          .map((n) => n.citaID as number),
      ),
    ];

    const citas =
      citaIds.length > 0
        ? await this.citaRepo.find({
            where: { citaID: In(citaIds), pacienteID },
          })
        : [];
    const citasPorId = new Map(citas.map((c) => [c.citaID, c]));

    return lista.map((n) => {
      const cita = n.citaID != null ? citasPorId.get(n.citaID) : undefined;
      const causa = (cita?.causaCancelacion ?? '').trim().toUpperCase();
      const canceladaPorMedico =
        cita?.estado === 'CANCELADA' &&
        CAUSAS_CANCELACION_MEDICO.includes(
          causa as (typeof CAUSAS_CANCELACION_MEDICO)[number],
        );

      return {
        ...n,
        motivoCancelacion: canceladaPorMedico
          ? (cita?.motivoCancelacion ?? null)
          : null,
        canceladaPorMedico: canceladaPorMedico || undefined,
      };
    });
  }

  async listarPorMedico(medicoID: number): Promise<NotificacionMedico[]> {
    return this.notifMedicoRepo.find({
      where: { medicoID },
      order: { fechaCreacion: 'DESC' },
      take: 50,
    });
  }

  async marcarLeida(
    pacienteID: number,
    notificacionID: number,
  ): Promise<Notificacion> {
    const notif = await this.notifRepo.findOne({
      where: { notificacionID, pacienteID },
    });
    if (!notif) {
      throw new NotFoundException('Notificación no encontrada');
    }
    notif.leida = true;
    return this.notifRepo.save(notif);
  }

  async marcarLeidaMedico(
    medicoID: number,
    notificacionID: number,
  ): Promise<NotificacionMedico> {
    const notif = await this.notifMedicoRepo.findOne({
      where: { notificacionID, medicoID },
    });
    if (!notif) {
      throw new NotFoundException('Notificación no encontrada');
    }
    notif.leida = true;
    return this.notifMedicoRepo.save(notif);
  }

  async contarNoLeidas(pacienteID: number): Promise<number> {
    return this.notifRepo.count({
      where: { pacienteID, leida: false },
    });
  }

  async contarNoLeidasMedico(medicoID: number): Promise<number> {
    return this.notifMedicoRepo.count({
      where: { medicoID, leida: false },
    });
  }

  async eliminar(pacienteID: number, notificacionID: number): Promise<void> {
    const r = await this.notifRepo.delete({ notificacionID, pacienteID });
    if (!r.affected) {
      throw new NotFoundException('Notificación no encontrada');
    }
  }
}
