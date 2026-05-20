import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cita } from './entities/cita.entity';
import { SlotAgenda } from '../horarios/entities/slot-agenda.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { PagosModule } from '../pagos/pagos.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { CitasService } from './citas.service';
import { CitasController } from './citas.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cita, SlotAgenda, Pago]),
    PagosModule,
    NotificacionesModule,
  ],
  controllers: [CitasController],
  providers: [CitasService],
  exports: [CitasService],
})
export class CitasModule {}
