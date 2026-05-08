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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CrearCitaDto } from './dto/crear-cita.dto';

@ApiTags('citas')
@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  crear(@CurrentUser() user: JwtPayload, @Body() dto: CrearCitaDto) {
    return this.citasService.crearReserva(user.sub, dto.slotID);
  }

  @Get('mis-citas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  misCitas(@CurrentUser() user: JwtPayload) {
    return this.citasService.misCitas(user.sub);
  }

  @Get('proxima')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  proxima(@CurrentUser() user: JwtPayload) {
    return this.citasService.proximaCitaPaciente(user.sub);
  }

  @Get('estadisticas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  estadisticas(@CurrentUser() user: JwtPayload) {
    return this.citasService.estadisticasPerfil(user.sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  obtener(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.citasService.obtenerSiPaciente(id, user.sub);
  }

  @Patch(':id/cancelar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  cancelar(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.citasService.cancelar(user.sub, id);
  }

  @Delete(':id/reserva')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  abandonar(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.citasService.abandonarPago(user.sub, id).then(() => ({
      ok: true,
    }));
  }
}
