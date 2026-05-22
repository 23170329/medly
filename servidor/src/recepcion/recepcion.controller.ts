import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RegistroDto } from '../usuarios/dto/registro.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CitasService } from '../citas/citas.service';
import { CrearCitaMostradorDto } from './dto/crear-cita-mostrador.dto';

@ApiTags('recepcion')
@Controller('recepcion')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RECEPCIONISTA')
@ApiBearerAuth()
export class RecepcionController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly citasService: CitasService,
  ) {}

  @Get('pacientes')
  buscarPacientes(@Query('q') q: string) {
    return this.usuariosService.buscarPacientes(q ?? '');
  }

  @Post('pacientes/registro')
  async registrarPaciente(@Body() dto: RegistroDto) {
    await this.usuariosService.registrarPaciente(dto);
    return {
      ok: true,
      mensaje:
        'Paciente registrado. Podrá iniciar sesión con su correo y contraseña.',
    };
  }

  @Get('citas')
  listarCitas() {
    return this.citasService.listarCitasRecepcion();
  }

  @Post('citas/mostrador')
  crearCitaMostrador(@Body() dto: CrearCitaMostradorDto) {
    return this.citasService.crearCitaMostrador(dto.pacienteId, dto.slotID);
  }
}
