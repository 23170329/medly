import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Paciente } from './entities/paciente.entity';
import { CuentaUsuario } from './entities/cuenta-usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Paciente, CuentaUsuario])],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService, TypeOrmModule],
})
export class UsuariosModule {}
