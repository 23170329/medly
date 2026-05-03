import { Controller, Post, Body } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('registro')
  async crearCuenta(@Body() datosRegistro: any) {
    return await this.usuariosService.registrarPaciente(datosRegistro);
  }
}
