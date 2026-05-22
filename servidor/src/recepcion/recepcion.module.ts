import { Module } from '@nestjs/common';
import { RecepcionController } from './recepcion.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { CitasModule } from '../citas/citas.module';
import { AuthModule } from '../auth/auth.module';
import { PagosModule } from '../pagos/pagos.module';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [UsuariosModule, CitasModule, AuthModule, PagosModule, StaffModule],
  controllers: [RecepcionController],
})
export class RecepcionModule {}
