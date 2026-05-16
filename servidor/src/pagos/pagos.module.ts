import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pago } from './entities/pago.entity';
import { Cita } from '../citas/entities/cita.entity';
import { SlotAgenda } from '../horarios/entities/slot-agenda.entity';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, Cita, SlotAgenda])],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}
