import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

// IMPORTANTE: Ajusta esta ruta y nombre de la clase según cómo lo tengas en tu proyecto
import { CuentaUsuario } from '../usuarios/entities/cuenta-usuario.entity'; 

@Module({
  // Importamos TypeORM para que el servicio pueda inyectar el repositorio
  imports: [TypeOrmModule.forFeature([CuentaUsuario])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}