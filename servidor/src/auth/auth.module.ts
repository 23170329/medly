import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CuentaUsuario } from '../usuarios/entities/cuenta-usuario.entity';
import { CuentaStaff } from '../staff/entities/cuenta-staff.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { PatientOnlyGuard } from './guards/patient-only.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    UsuariosModule,
    AuditoriaModule,
    TypeOrmModule.forFeature([CuentaUsuario, CuentaStaff]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '7d') as never,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PatientOnlyGuard, RolesGuard],
  exports: [
    AuthService,
    JwtModule,
    PatientOnlyGuard,
    RolesGuard,
    PassportModule,
  ],
})
export class AuthModule {}
