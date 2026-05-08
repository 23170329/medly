import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlotAgenda } from './entities/slot-agenda.entity';
import { HorariosService } from './horarios.service';
import { HorariosController } from './horarios.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SlotAgenda])],
  controllers: [HorariosController],
  providers: [HorariosService],
  exports: [HorariosService],
})
export class HorariosModule {}
