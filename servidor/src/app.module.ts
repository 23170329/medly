import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { Medico } from './medicos/entities/medico.entity';
import { MedicoSucursal } from './medicos/entities/medico-sucursal.entity';
import { SlotAgenda } from './horarios/entities/slot-agenda.entity';
import { Cita } from './citas/entities/cita.entity';
import { Pago } from './pagos/entities/pago.entity';

const entities = [
  Paciente,
  CuentaUsuario,
  Especialidad,
  Sucursal,
  Medico,
  MedicoSucursal,
  SlotAgenda,
  Cita,
  Pago,
];

@Module({
  imports: [
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
            synchronize: false,
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
          synchronize: false,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
