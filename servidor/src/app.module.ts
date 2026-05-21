import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ContentTypeGuard } from './common/guards/content-type.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { MedicosModule } from './medicos/medicos.module';
import { HorariosModule } from './horarios/horarios.module';
import { CitasModule } from './citas/citas.module';
import { PagosModule } from './pagos/pagos.module';
import { EspecialidadesModule } from './especialidades/especialidades.module';
import { envValidationSchema } from './config/env.validation';
import { Paciente } from './usuarios/entities/paciente.entity';
import { CuentaUsuario } from './usuarios/entities/cuenta-usuario.entity';
import { Especialidad } from './especialidades/entities/especialidad.entity';
import { Sucursal } from './sucursales/entities/sucursal.entity';
import { Consultorio } from './sucursales/entities/consultorio.entity';
import { Medico } from './medicos/entities/medico.entity';
import { Calificacion } from './medicos/entities/calificacion.entity';
import { MedicoSucursal } from './medicos/entities/medico-sucursal.entity';
import { SlotAgenda } from './horarios/entities/slot-agenda.entity';
import { Horario } from './horarios/entities/horario.entity';
import { Cita } from './citas/entities/cita.entity';
import { Pago } from './pagos/entities/pago.entity';
import { CuentaStaff } from './staff/entities/cuenta-staff.entity';
import { BloqueoAgenda } from './horarios/entities/bloqueo-agenda.entity';
import { ConsultaClinica } from './consultas/entities/consulta-clinica.entity';
import { Notificacion } from './notificaciones/entities/notificacion.entity';
import { Auditoria } from './auditoria/entities/auditoria.entity';
import { RecepcionModule } from './recepcion/recepcion.module';
import { MedicoPanelModule } from './medico-panel/medico-panel.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { AuditoriaModule } from './auditoria/auditoria.module';

const entities = [
  Paciente,
  CuentaUsuario,
  CuentaStaff,
  Especialidad,
  Sucursal,
  Consultorio,
  Medico,
  Calificacion,
  MedicoSucursal,
  SlotAgenda,
  Horario,
  BloqueoAgenda,
  Cita,
  Pago,
  ConsultaClinica,
  Notificacion,
  Auditoria,
];

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'general',
        ttl: 60_000,
        limit: 60,
      },
      {
        name: 'auth',
        ttl: 60_000,
        limit: 10,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbUrl = config.get<string>('DATABASE_URL');
        if (dbUrl) {
          const parsed = new URL(dbUrl);
          return {
            type: 'postgres',
            host: parsed.hostname,
            port: Number(parsed.port || 5432),
            username: parsed.username,
            password: parsed.password,
            database: parsed.pathname.slice(1),
            entities,
            synchronize: true,
            logging: config.get('NODE_ENV') === 'development',
          };
        }
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASS'),
          database: config.get<string>('DB_NAME'),
          entities,
          synchronize: true,
          logging: config.get('NODE_ENV') === 'development',
        };
      },
    }),
    AuthModule,
    UsuariosModule,
    EspecialidadesModule,
    SucursalesModule,
    MedicosModule,
    HorariosModule,
    CitasModule,
    PagosModule,
    RecepcionModule,
    MedicoPanelModule,
    NotificacionesModule,
    AuditoriaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ContentTypeGuard,
    },
  ],
})
export class AppModule {}
