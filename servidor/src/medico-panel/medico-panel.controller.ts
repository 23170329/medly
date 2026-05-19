import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CitasService } from '../citas/citas.service';
import { BloqueosService, CrearBloqueoDto } from '../horarios/bloqueos.service';
import { ConsultasService } from '../consultas/consultas.service';
import { CrearConsultaDto } from '../consultas/dto/crear-consulta.dto';
import { ActualizarConsultaDto } from '../consultas/dto/actualizar-consulta.dto';

@ApiTags('medico')
@Controller('medico')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MEDICO')
@ApiBearerAuth()
export class MedicoPanelController {
  constructor(
    private readonly citasService: CitasService,
    private readonly bloqueosService: BloqueosService,
    private readonly consultasService: ConsultasService,
  ) {}

  private medicoId(u: JwtPayload): number {
    if (u.medicoId == null) {
      throw new BadRequestException('Cuenta sin médico asociado');
    }
    return u.medicoId;
  }

  @Get('citas/pendientes-atencion')
  citasPendientes(@CurrentUser() u: JwtPayload) {
    return this.citasService.listarCitasPendientesAtencionMed(this.medicoId(u));
  }

  @Get('citas')
  misCitas(@CurrentUser() u: JwtPayload) {
    return this.citasService.listarCitasMedico(this.medicoId(u));
  }

  @Patch('citas/:id/cancelar')
  cancelarCita(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.citasService.cancelarPorMedico(this.medicoId(u), id);
  }

  @Get('bloqueos')
  listarBloqueos(@CurrentUser() u: JwtPayload) {
    return this.bloqueosService.listar(this.medicoId(u));
  }

  @Post('bloqueos')
  crearBloqueo(@CurrentUser() u: JwtPayload, @Body() dto: CrearBloqueoDto) {
    return this.bloqueosService.crear(this.medicoId(u), dto);
  }

  @Delete('bloqueos/:id')
  eliminarBloqueo(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bloqueosService
      .eliminar(this.medicoId(u), id)
      .then(() => ({ ok: true }));
  }

  @Get('consultas')
  listarConsultas(
    @CurrentUser() u: JwtPayload,
    @Query('pacienteId') pacienteId?: string,
  ) {
    const pid =
      pacienteId != null && pacienteId !== ''
        ? parseInt(pacienteId, 10)
        : undefined;
    return this.consultasService.listarPorMedico(
      this.medicoId(u),
      pid != null && Number.isFinite(pid) ? pid : undefined,
    );
  }

  @Get('consultas/:id')
  obtenerConsulta(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.consultasService.obtener(this.medicoId(u), id);
  }

  @Post('consultas')
  crearConsulta(@CurrentUser() u: JwtPayload, @Body() dto: CrearConsultaDto) {
    return this.consultasService.crear(this.medicoId(u), dto);
  }

  @Patch('consultas/:id')
  actualizarConsulta(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarConsultaDto,
  ) {
    return this.consultasService.actualizar(this.medicoId(u), id, dto);
  }
}
