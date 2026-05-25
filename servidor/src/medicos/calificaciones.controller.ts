import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PatientOnlyGuard } from '../auth/guards/patient-only.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CalificacionesService } from './calificaciones.service';
import { CrearCalificacionDto } from './dto/crear-calificacion.dto';

@ApiTags('calificaciones')
@Controller('calificaciones')
@UseGuards(JwtAuthGuard, PatientOnlyGuard)
@ApiBearerAuth()
export class CalificacionesController {
  constructor(private readonly calificacionesService: CalificacionesService) {}

  @Post()
  crear(@CurrentUser() u: JwtPayload, @Body() dto: CrearCalificacionDto) {
    return this.calificacionesService.crear(u.sub, dto);
  }

  @Get('cita/:citaId/estado')
  estado(
    @CurrentUser() u: JwtPayload,
    @Param('citaId', ParseIntPipe) citaId: number,
  ) {
    return this.calificacionesService
      .yaCalificada(u.sub, citaId)
      .then((calificada) => ({ calificada }));
  }
}
