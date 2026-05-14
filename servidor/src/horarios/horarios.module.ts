import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlotAgenda } from './entities/slot-agenda.entity';
import { BloqueoAgenda } from './entities/bloqueo-agenda.entity';
import { HorariosService } from './horarios.service';
import { HorariosController } from './horarios.controller';
import { BloqueosService } from './bloqueos.service';

@Module({
  imports: [TypeOrmModule.forFeature([SlotAgenda, BloqueoAgenda])],
  controllers: [HorariosController],
  providers: [HorariosService, BloqueosService],
  exports: [HorariosService, BloqueosService],
})
export class HorariosModule {}
