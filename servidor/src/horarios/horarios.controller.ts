import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HorariosService } from './horarios.service';
import { CrearHorarioDto } from './dto/crear-horario.dto';
import { ActualizarHorarioDto } from './dto/actualizar-horario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('horarios')
@Controller('horarios')
export class HorariosController {
  constructor(private readonly svc: HorariosService) {}

  @Get('disponibles')
  async disponibles(
    @Query('medicoId') medicoId: string,
    @Query('sucursalId') sucursalId: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    const mid = parseInt(medicoId, 10);
    const sid = parseInt(sucursalId, 10);
    if (!mid || !sid) {
      throw new BadRequestException('medicoId y sucursalId son obligatorios');
    }
    const d = desde ? new Date(desde) : undefined;
    const h = hasta ? new Date(hasta) : undefined;
    return this.svc.disponiblesRangoQuery({
      medicoId: mid,
      sucursalId: sid,
      desde: d,
      hasta: h,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEDICO', 'RECEPCIONISTA')
  @ApiBearerAuth()
  async crear(@Body() dto: CrearHorarioDto) {
    return this.svc.crearHorario(dto);
  }

  @Get('medico/:medicoId')
  async listarPorMedico(@Param('medicoId', ParseIntPipe) medicoId: number) {
    return this.svc.obtenerHorariosPorMedico(medicoId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEDICO', 'RECEPCIONISTA')
  @ApiBearerAuth()
  async obtener(@Param('id', ParseIntPipe) id: number) {
    return this.svc.obtenerHorario(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEDICO', 'RECEPCIONISTA')
  @ApiBearerAuth()
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarHorarioDto,
  ) {
    return this.svc.actualizarHorario(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEDICO', 'RECEPCIONISTA')
  @ApiBearerAuth()
  async eliminar(@Param('id', ParseIntPipe) id: number) {
    await this.svc.eliminarHorario(id);
    return { ok: true };
  }
}
