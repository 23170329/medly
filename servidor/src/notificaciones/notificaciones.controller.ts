import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PatientOnlyGuard } from '../auth/guards/patient-only.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { NotificacionesService } from './notificaciones.service';

@ApiTags('notificaciones')
@Controller('notificaciones')
@UseGuards(JwtAuthGuard, PatientOnlyGuard)
@ApiBearerAuth()
export class NotificacionesController {
  constructor(
    private readonly notificacionesService: NotificacionesService,
  ) {}

  @Get()
  listar(@CurrentUser() u: JwtPayload) {
    return this.notificacionesService.listarPorPaciente(u.sub);
  }

  @Get('no-leidas')
  contarNoLeidas(@CurrentUser() u: JwtPayload) {
    return this.notificacionesService.contarNoLeidas(u.sub);
  }

  @Patch(':id/leida')
  marcarLeida(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificacionesService.marcarLeida(u.sub, id);
  }

  @Delete(':id')
  eliminar(
    @CurrentUser() u: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificacionesService.eliminar(u.sub, id).then(() => ({
      ok: true,
    }));
  }
}
