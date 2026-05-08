import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MedicosService } from './medicos.service';

@ApiTags('medicos')
@Controller('medicos')
export class MedicosController {
  constructor(private readonly svc: MedicosService) {}

  @Get()
  listar(
    @Query('especialidadId') especialidadId?: string,
    @Query('sucursalId') sucursalId?: string,
    @Query('q') q?: string,
  ) {
    return this.svc.listar({
      especialidadId: especialidadId
        ? parseInt(especialidadId, 10)
        : undefined,
      sucursalId: sucursalId ? parseInt(sucursalId, 10) : undefined,
      q,
    });
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.svc.obtener(id);
  }

  @Get(':id/sucursales')
  sucursales(@Param('id', ParseIntPipe) id: number) {
    return this.svc.sucursalesDeMedico(id);
  }
}
