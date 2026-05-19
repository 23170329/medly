import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medico } from './entities/medico.entity';
import { MedicoSucursal } from './entities/medico-sucursal.entity';
import { MedicosService } from './medicos.service';
import { MedicosController } from './medicos.controller';
import { Calificacion } from './entities/calificacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Medico, MedicoSucursal])],
  controllers: [MedicosController],
  providers: [MedicosService],
  exports: [MedicosService],
})
export class MedicosModule {}
