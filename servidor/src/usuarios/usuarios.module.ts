import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Importante para la DB
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Paciente } from './entities/paciente.entity'; // Importa la entidad
import { CuentaUsuario } from './entities/cuenta-usuario.entity'; // Importa la entidad

@Module({
  imports: [
    // Esto le dice a NestJS qué tablas debe manejar este módulo
    TypeOrmModule.forFeature([Paciente, CuentaUsuario])
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService] // Exportarlo por si el módulo de Auth lo necesita
})
export class UsuariosModule {}