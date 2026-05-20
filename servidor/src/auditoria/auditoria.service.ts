import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria, EventoAuditoria } from './entities/auditoria.entity';
import { Request } from 'express';

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepo: Repository<Auditoria>,
  ) {}

  private extraerIP(req?: Request): string | null {
    if (!req) return null;
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return req.ip ?? null;
  }

  async registrar(params: {
    tipo: EventoAuditoria;
    descripcion?: string;
    usuarioID?: number;
    req?: Request;
  }): Promise<void> {
    try {
      const entry = this.auditoriaRepo.create({
        tipo: params.tipo,
        descripcion: params.descripcion ?? null,
        usuarioID: params.usuarioID ?? null,
        direccionIP: this.extraerIP(params.req),
      });
      await this.auditoriaRepo.save(entry);
    } catch (err) {
      this.logger.error('Error registrando auditoría', err);
    }
  }

  async listar(limit = 100): Promise<Auditoria[]> {
    return this.auditoriaRepo.find({
      order: { fecha: 'DESC' },
      take: limit,
    });
  }

  async listarPorUsuario(usuarioID: number, limit = 50): Promise<Auditoria[]> {
    return this.auditoriaRepo.find({
      where: { usuarioID },
      order: { fecha: 'DESC' },
      take: limit,
    });
  }
}
