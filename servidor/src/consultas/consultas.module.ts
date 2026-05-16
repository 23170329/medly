import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultaClinica } from './entities/consulta-clinica.entity';
import { ConsultasService } from './consultas.service';
import { Cita } from '../citas/entities/cita.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConsultaClinica, Cita])],
  providers: [ConsultasService],
  exports: [ConsultasService],
})
export class ConsultasModule {}
