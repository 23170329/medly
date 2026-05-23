import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PatientOnlyGuard } from '../auth/guards/patient-only.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { ConsultasService } from './consultas.service';

@ApiTags('paciente-resultados')
@Controller('paciente/resultados')
@UseGuards(JwtAuthGuard, PatientOnlyGuard)
@ApiBearerAuth()
export class PacienteConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  @Get()
  listar(
    @CurrentUser() u: JwtPayload,
    @Query('tipo') tipo: 'diagnostico' | 'laboratorio' = 'diagnostico',
  ) {
    const t = tipo === 'laboratorio' ? 'laboratorio' : 'diagnostico';
    return this.consultasService.listarResultadosPaciente(u.sub, t);
  }

  @Get(':id')
  detalle(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.consultasService.obtenerResultadoPaciente(u.sub, id);
  }
}
