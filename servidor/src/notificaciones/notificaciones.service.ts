import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notifRepo: Repository<Notificacion>,
  ) {}

  async crear(params: {
    pacienteID: number;
    titulo: string;
    mensaje: string;
  }): Promise<Notificacion> {
    const notif = this.notifRepo.create({
      pacienteID: params.pacienteID,
      titulo: params.titulo,
      mensaje: params.mensaje,
    });
    return this.notifRepo.save(notif);
  }

  async listarPorPaciente(pacienteID: number): Promise<Notificacion[]> {
    return this.notifRepo.find({
      where: { pacienteID },
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

  async contarNoLeidas(pacienteID: number): Promise<number> {
    return this.notifRepo.count({
      where: { pacienteID, leida: false },
    });
  }
}
