import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultaClinica } from './entities/consulta-clinica.entity';
import { ConsultasService } from './consultas.service';
import { Cita } from '../citas/entities/cita.entity';
import { Paciente } from '../usuarios/entities/paciente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConsultaClinica, Cita, Paciente])],
  providers: [ConsultasService],
  exports: [ConsultasService],
})
export class ConsultasModule {}
