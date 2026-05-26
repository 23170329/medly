import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { NotificacionMedico } from './entities/notificacion-medico.entity';
import { Cita } from '../citas/entities/cita.entity';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesController } from './notificaciones.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notificacion, NotificacionMedico, Cita]),
  ],
  controllers: [NotificacionesController],
  providers: [NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
