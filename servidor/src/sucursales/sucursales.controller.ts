import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SucursalesService } from './sucursales.service';

@ApiTags('sucursales')
@Controller('sucursales')
export class SucursalesController {
  constructor(private readonly svc: SucursalesService) {}

  @Get()
  listar() {
    return this.svc.listar();
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.svc.obtener(id);
  }
}
