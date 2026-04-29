import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { MedicosModule } from './medicos/medicos.module';
import { HorariosModule } from './horarios/horarios.module';
import { CitasModule } from './citas/citas.module';
import { PagosModule } from './pagos/pagos.module';

@Module({
  imports: [AuthModule, UsuariosModule, SucursalesModule, MedicosModule, HorariosModule, CitasModule, PagosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
