import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sucursal } from './entities/sucursal.entity';
import { SucursalesService } from './sucursales.service';
import { SucursalesController } from './sucursales.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Sucursal])],
  controllers: [SucursalesController],
  providers: [SucursalesService],
  exports: [SucursalesService],
})
export class SucursalesModule {}
