import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { correo: string; contrasena: string }) {
    // Validamos que la app móvil realmente haya enviado los datos
    if (!body.correo || !body.contrasena) {
      throw new HttpException('Faltan datos de acceso', HttpStatus.BAD_REQUEST);
    }
    
    // Ejecutamos la lógica de validación que pusimos en el servicio
    return this.authService.validarUsuario(body.correo, body.contrasena);
  }
}