import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Medico } from './entities/medico.entity';
import { MedicoSucursal } from './entities/medico-sucursal.entity';
import { MedicosService } from './medicos.service';
import { MedicosController } from './medicos.controller';
import { CalificacionesController } from './calificaciones.controller';
import { CalificacionesService } from './calificaciones.service';
import { Calificacion } from './entities/calificacion.entity';
import { Cita } from '../citas/entities/cita.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Medico, MedicoSucursal, Calificacion, Cita]),
    AuthModule,
  ],
  controllers: [MedicosController, CalificacionesController],
  providers: [MedicosService, CalificacionesService],
  exports: [MedicosService, CalificacionesService],
})
export class MedicosModule {}
