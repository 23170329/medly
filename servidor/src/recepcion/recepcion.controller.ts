import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { RegistroRecepcionDto } from '../usuarios/dto/registro-recepcion.dto';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CitasService } from '../citas/citas.service';
import { PagosService } from '../pagos/pagos.service';
import { StaffService } from '../staff/staff.service';
import { CrearCitaMostradorDto } from './dto/crear-cita-mostrador.dto';
import { CheckoutSessionDto } from '../pagos/dto/checkout-session.dto';
import { validarCoherenciaCurpServidor } from '../common/curp-coherencia';

@ApiTags('recepcion')
@Controller('recepcion')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RECEPCIONISTA')
@ApiBearerAuth()
export class RecepcionController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly citasService: CitasService,
    private readonly pagosService: PagosService,
    private readonly staffService: StaffService,
  ) {}

  private async sucursalDelStaff(user: JwtPayload): Promise<number | null> {
    const staff = await this.staffService.obtenerRecepcionista(user.sub);
    return staff.sucursalID;
  }

  @Get('pacientes')
  buscarPacientes(@Query('q') q: string) {
    return this.usuariosService.buscarPacientes(q ?? '');
  }

  @Get('pacientes/:id')
  obtenerPaciente(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.obtenerPerfil(id);
  }

  @Post('pacientes/registro')
  async registrarPaciente(@Body() dto: RegistroRecepcionDto) {
    await this.usuariosService.registrarPacienteRecepcion(dto);
    const conCorreo = Boolean(dto.correoElectronico?.trim());
    return {
      ok: true,
      mensaje: conCorreo
        ? 'Paciente registrado. Podrá iniciar sesión con su correo, CURP o teléfono.'
        : 'Paciente registrado. Podrá iniciar sesión con su CURP o teléfono y contraseña.',
    };
  }

  @Get('citas')
  async listarCitas(@CurrentUser() user: JwtPayload) {
    const sucursalId = await this.sucursalDelStaff(user);
    return this.citasService.listarCitasRecepcion(sucursalId);
  }

  @Get('citas/:id')
  async obtenerCita(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const sucursalId = await this.sucursalDelStaff(user);
    return this.citasService.obtenerCitaRecepcion(id, sucursalId);
  }

  @Post('citas/reserva')
  async crearReserva(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CrearCitaMostradorDto,
  ) {
    const sucursalId = await this.sucursalDelStaff(user);
    await this.citasService.asegurarSlotEnSucursal(dto.slotID, sucursalId);
    const paciente = await this.usuariosService.obtenerPerfil(dto.pacienteId);
    const errCurp = validarCoherenciaCurpServidor({
      curp: paciente.curp,
      nombre: paciente.nombre,
      apellido_pat: paciente.apellido_pat,
      apellido_mat: paciente.apellido_mat ?? '',
      fechaNacimiento: String(paciente.fechaNacimiento).slice(0, 10),
    });
    if (errCurp) {
      throw new BadRequestException(
        `No se puede agendar: ${errCurp} Actualiza los datos del paciente.`,
      );
    }
    return this.citasService.crearReserva(dto.pacienteId, dto.slotID);
  }

  @Post('citas/mostrador')
  async crearCitaMostrador(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CrearCitaMostradorDto,
  ) {
    const sucursalId = await this.sucursalDelStaff(user);
    await this.citasService.asegurarSlotEnSucursal(dto.slotID, sucursalId);
    const paciente = await this.usuariosService.obtenerPerfil(dto.pacienteId);
    const errCurp = validarCoherenciaCurpServidor({
      curp: paciente.curp,
      nombre: paciente.nombre,
      apellido_pat: paciente.apellido_pat,
      apellido_mat: paciente.apellido_mat ?? '',
      fechaNacimiento: String(paciente.fechaNacimiento).slice(0, 10),
    });
    if (errCurp) {
      throw new BadRequestException(
        `No se puede agendar: ${errCurp} Actualiza los datos del paciente.`,
      );
    }
    const cita = await this.citasService.crearCitaMostrador(
      dto.pacienteId,
      dto.slotID,
    );
    return {
      ...cita,
      mensaje:
        'Anticipo del 50% registrado correctamente. La cita quedó con anticipo realizado.',
    };
  }

  @Post('pagos/anticipo-realizado')
  async anticipoRealizado(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CheckoutSessionDto,
  ) {
    const sucursalId = await this.sucursalDelStaff(user);
    return this.pagosService.marcarAnticipoRealizadoRecepcion(
      dto.citaID,
      sucursalId,
    );
  }

  @Post('pagos/checkout-session')
  async checkoutSession(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CheckoutSessionDto,
  ) {
    const sucursalId = await this.sucursalDelStaff(user);
    return this.pagosService.crearCheckoutSessionRecepcion(
      dto.citaID,
      sucursalId,
    );
  }
}
