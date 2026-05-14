import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegistroDto } from '../usuarios/dto/registro.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  async registro(@Body() body: RegistroDto) {
    return this.authService.registrar(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.validarUsuario(body.correo, body.contrasena);
  }

  @Post('refresh')
  async refresh(@Body() body: RefreshDto) {
    return this.authService.refreshSession(body.refresh_token);
  }
}
