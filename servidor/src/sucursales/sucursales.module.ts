import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SucursalesService } from './sucursales.service';
import { SucursalesController } from './sucursales.controller';
import { Sucursal } from './entities/sucursal.entity';
import { Consultorio } from './entities/consultorio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sucursal, Consultorio])],
  controllers: [SucursalesController],
  providers: [SucursalesService],
  exports: [SucursalesService],
})
export class SucursalesModule {}
