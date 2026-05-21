import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginPacienteDto } from './dto/login-paciente.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegistroDto } from '../usuarios/dto/registro.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('registro')
  async registro(@Body() body: RegistroDto, @Req() req: Request) {
    return this.authService.registrar(body, req);
  }

  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: Request) {
    return this.authService.validarUsuario(body.correo, body.contrasena, req);
  }

  /** Login con correo, CURP o teléfono (usar esta ruta en la app móvil). */
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @Post('ingreso')
  async ingreso(@Body() body: LoginPacienteDto, @Req() req: Request) {
    return this.authService.validarUsuario(
      body.identificador,
      body.contrasena,
      req,
    );
  }

  @Post('refresh')
  async refresh(@Body() body: RefreshDto) {
    return this.authService.refreshSession(body.refresh_token);
  }
}
