import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { SucursalesService } from './sucursales.service';
import { Sucursal } from './entities/sucursal.entity';

@Controller(['sucursal', 'sucursales'])
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @Post()
  async crear(@Body() datos: Partial<Sucursal>) {
    return await this.sucursalesService.crearSucursal(datos);
  }

  @Get()
  async obtenerTodas() {
    return await this.sucursalesService.obtenerActivas();
  }

  @Get(':id')
  async obtenerUna(@Param('id', ParseIntPipe) id: number) {
    return await this.sucursalesService.obtenerPorId(id);
  }

  @Delete(':id')
  async desactivar(@Param('id', ParseIntPipe) id: number) {
    return await this.sucursalesService.desactivarSucursal(id);
  }

  //Creacion de los consultorios
  @Post('consultorio')
  async agregarConsultorio(
    @Body('sucursalID') sucursalID: number,
    @Body('numeroConsultorio') numeroConsultorio: string,
  ) {
    return await this.sucursalesService.crearConsultorio(
      sucursalID,
      numeroConsultorio,
    );
  }

  // Endpoint para obtener los consultorios de una sucursal: /sucursal/1/consultorios
  @Get(':id/consultorios')
  async listarConsultorios(@Param('id', ParseIntPipe) id: number) {
    return await this.sucursalesService.obtenerConsultoriosPorSucursal(id);
  }
}
