import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { RegistroDto } from './dto/registro.dto';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PatientOnlyGuard } from '../auth/guards/patient-only.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';

@ApiTags('usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /** @deprecated Prefer `POST /auth/registro` (devuelve JWT). Se mantiene para integraciones que solo crean cuenta. */
  @Post('registro')
  async crearCuenta(@Body() datosRegistro: RegistroDto) {
    return await this.usuariosService.registrarPaciente(datosRegistro);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard, PatientOnlyGuard)
  @ApiBearerAuth()
  perfil(@CurrentUser() user: JwtPayload) {
    return this.usuariosService.obtenerPerfil(user.sub);
  }

  @Patch('perfil')
  @UseGuards(JwtAuthGuard, PatientOnlyGuard)
  @ApiBearerAuth()
  actualizarPerfil(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ActualizarPerfilDto,
  ) {
    return this.usuariosService.actualizarPerfil(user.sub, dto);
  }
}
