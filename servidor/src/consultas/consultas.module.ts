import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultaClinica } from './entities/consulta-clinica.entity';
import { ConsultasService } from './consultas.service';
import { PacienteConsultasController } from './paciente-consultas.controller';
import { Cita } from '../citas/entities/cita.entity';
import { Paciente } from '../usuarios/entities/paciente.entity';
import { Medico } from '../medicos/entities/medico.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsultaClinica, Cita, Paciente, Medico]),
    AuthModule,
    NotificacionesModule,
  ],
  controllers: [PacienteConsultasController],
  providers: [ConsultasService],
  exports: [ConsultasService],
})
export class ConsultasModule {}
