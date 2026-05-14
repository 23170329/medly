import { Module } from '@nestjs/common';
import { RecepcionController } from './recepcion.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { CitasModule } from '../citas/citas.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsuariosModule, CitasModule, AuthModule],
  controllers: [RecepcionController],
})
export class RecepcionModule {}
