import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CitasService } from './citas.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PatientOnlyGuard } from '../auth/guards/patient-only.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CrearCitaDto } from './dto/crear-cita.dto';
import { AuditoriaService } from '../auditoria/auditoria.service';

@ApiTags('citas')
@Controller('citas')
@UseGuards(JwtAuthGuard, PatientOnlyGuard)
export class CitasController {
  constructor(
    private readonly citasService: CitasService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  @Post()
  @ApiBearerAuth()
  async crear(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CrearCitaDto,
  ) {
    const cita = await this.citasService.crearReserva(user.sub, dto.slotID);
    await this.auditoriaService.registrar({
      tipo: 'CITA_CREADA',
      descripcion: `Cita #${cita.citaID} creada para paciente #${user.sub}`,
      usuarioID: user.sub,
    });
    return cita;
  }

  @Get('mis-citas')
  @ApiBearerAuth()
  misCitas(@CurrentUser() user: JwtPayload) {
    return this.citasService.misCitas(user.sub);
  }

  @Get('proxima')
  @ApiBearerAuth()
  proxima(@CurrentUser() user: JwtPayload) {
    return this.citasService.proximaCitaPaciente(user.sub);
  }

  @Get('estadisticas')
  @ApiBearerAuth()
  estadisticas(@CurrentUser() user: JwtPayload) {
    return this.citasService.estadisticasPerfil(user.sub);
  }

  @Get('historial')
  @ApiBearerAuth()
  historial(@CurrentUser() user: JwtPayload) {
    return this.citasService.listarHistorialPaciente(user.sub);
  }

  @Get('historial/:id')
  @ApiBearerAuth()
  historialDetalle(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.citasService.detalleHistorialPaciente(user.sub, id);
  }

  @Get(':id')
  @ApiBearerAuth()
  obtener(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.citasService.obtenerSiPaciente(id, user.sub);
  }

  @Patch(':id/cancelar')
  @ApiBearerAuth()
  async cancelar(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const result = await this.citasService.cancelar(user.sub, id);
    await this.auditoriaService.registrar({
      tipo: 'CITA_CANCELADA_PACIENTE',
      descripcion: `Cita #${id} cancelada por paciente #${user.sub}`,
      usuarioID: user.sub,
    });
    return result;
  }

  @Delete(':id/reserva')
  @ApiBearerAuth()
  async abandonar(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.citasService.abandonarPago(user.sub, id);
    await this.auditoriaService.registrar({
      tipo: 'RESERVA_ABANDONADA',
      descripcion: `Reserva #${id} abandonada por paciente #${user.sub}`,
      usuarioID: user.sub,
    });
    return { ok: true };
  }
}
