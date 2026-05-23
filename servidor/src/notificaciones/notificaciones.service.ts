import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { NotificacionMedico } from './entities/notificacion-medico.entity';

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

  async listarPorPaciente(pacienteID: number): Promise<Notificacion[]> {
    return this.notifRepo.find({
      where: { pacienteID },
      order: { fechaCreacion: 'DESC' },
      take: 50,
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
