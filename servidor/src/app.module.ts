import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { MedicosModule } from './medicos/medicos.module';
import { HorariosModule } from './horarios/horarios.module';
import { CitasModule } from './citas/citas.module';
import { PagosModule } from './pagos/pagos.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'secret',
      database: 'medly',
      autoLoadEntities: true,
      synchronize: true, 
    }),
    AuthModule, UsuariosModule, SucursalesModule, MedicosModule, HorariosModule, CitasModule, PagosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
