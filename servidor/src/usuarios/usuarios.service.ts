import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Paciente } from './entities/paciente.entity';
import { CuentaUsuario } from './entities/cuenta-usuario.entity';
import { RegistroDto } from './dto/registro.dto';
import { RegistroRecepcionDto } from './dto/registro-recepcion.dto';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { validarCoherenciaCurpServidor } from '../common/curp-coherencia';
import { OrigenRegistro } from '../common/enums';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
    @InjectRepository(CuentaUsuario)
    private readonly cuentaRepo: Repository<CuentaUsuario>,
  ) {}

  async registrarPaciente(
    datos: RegistroDto,
    opts?: { origenRegistro?: OrigenRegistro },
  ) {
    const curpNorm = datos.curp.trim().toUpperCase();
    const apellidoMat = datos.apellido_mat?.trim() || null;
    const correoIngresado = (datos.correoElectronico ?? '').trim().toLowerCase();
    const correoNorm =
      correoIngresado ||
      `pac.${curpNorm.toLowerCase()}@sin-correo.paciente`;

    if (correoIngresado && /@medly\./i.test(correoIngresado)) {
      throw new BadRequestException(
        'No se permiten correos con dominio @medly',
      );
    }
    if (correoIngresado) {
      const duplicado = await this.pacienteRepo
        .createQueryBuilder('p')
        .where('LOWER(TRIM(p.correoElectronico)) = :correo', {
          correo: correoIngresado,
        })
        .getCount();
      if (duplicado > 0) {
        throw new ConflictException('El correo ya está registrado');
      }
    }
    const telefonoNorm = datos.telefono.replace(/\D/g, '');
    const curpDup = await this.pacienteRepo.exist({
      where: { curp: curpNorm },
    });
    if (curpDup) {
      throw new ConflictException('La CURP ya está registrada');
    }

    const hash = await bcrypt.hash(datos.password, 10);

    const nuevoPaciente = this.pacienteRepo.create({
      nombre: datos.nombre,
      apellido_pat: datos.apellido_pat,
      apellido_mat: apellidoMat,
      correoElectronico: correoNorm,
      telefono: telefonoNorm,
      fechaNacimiento: datos.fechaNacimiento,
      genero: datos.genero,
      curp: curpNorm,
    });
    const pacienteGuardado = await this.pacienteRepo.save(nuevoPaciente);

    const nuevaCuenta = this.cuentaRepo.create({
      password: hash,
      paciente: pacienteGuardado,
      esInvitado: false,
      origenRegistro: opts?.origenRegistro ?? OrigenRegistro.AUTOREGISTRO,
    });

    return await this.cuentaRepo.save(nuevaCuenta);
  }

  /** Registro en mostrador: correo opcional; valida coherencia CURP. */
  async registrarPacienteRecepcion(datos: RegistroRecepcionDto) {
    const curpNorm = datos.curp.trim().toUpperCase();
    const errCurp = validarCoherenciaCurpServidor({
      curp: curpNorm,
      nombre: datos.nombre,
      apellido_pat: datos.apellido_pat,
      apellido_mat: datos.apellido_mat ?? '',
      fechaNacimiento: datos.fechaNacimiento,
    });
    if (errCurp) {
      throw new BadRequestException(errCurp);
    }

    const passwordTemporal = this.generarPasswordTemporalRecepcion(
      datos.nombre,
      datos.fechaNacimiento,
    );

    const cuenta = await this.registrarPaciente(
      {
        ...datos,
        curp: curpNorm,
        password: passwordTemporal,
      },
      { origenRegistro: OrigenRegistro.RECEPCION },
    );

    return { cuenta, passwordTemporal };
  }

  private generarPasswordTemporalRecepcion(
    nombreCompleto: string,
    fechaNacimientoYYYYMMDD: string,
  ): string {
    const primerNombre = this.extraerPrimerNombreNormalizado(nombreCompleto);
    const ddmmyyyy = this.formatearFechaDDMMYYYY(fechaNacimientoYYYYMMDD);
    return `${primerNombre}${ddmmyyyy}`;
  }

  private extraerPrimerNombreNormalizado(nombreCompleto: string): string {
    const limpio = (nombreCompleto ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)[0];
    const base = (limpio || 'paciente')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '');
    return base || 'paciente';
  }

  private formatearFechaDDMMYYYY(fechaNacimientoYYYYMMDD: string): string {
    // Entrada validada por DTO: YYYY-MM-DD
    const [yyyy, mm, dd] = String(fechaNacimientoYYYYMMDD).split('-');
    const d2 = String(dd ?? '').padStart(2, '0').slice(0, 2);
    const m2 = String(mm ?? '').padStart(2, '0').slice(0, 2);
    const y4 = String(yyyy ?? '').padStart(4, '0').slice(0, 4);
    return `${d2}${m2}${y4}`;
  }

  async obtenerPerfil(pacienteId: number) {
    const p = await this.pacienteRepo.findOne({
      where: { pacienteID: pacienteId },
    });
    if (!p) {
      throw new NotFoundException('Paciente no encontrado');
    }
    const apellido = [p.apellido_pat, p.apellido_mat].filter(Boolean).join(' ');
    return {
      pacienteID: p.pacienteID,
      nombre: p.nombre,
      apellido_pat: p.apellido_pat,
      apellido_mat: p.apellido_mat,
      apellido,
      correoElectronico: p.correoElectronico,
      telefono: p.telefono,
      fechaNacimiento: p.fechaNacimiento,
      genero: p.genero,
      curp: p.curp,
    };
  }

  async actualizarPerfil(pacienteId: number, dto: ActualizarPerfilDto) {
    const p = await this.pacienteRepo.findOne({
      where: { pacienteID: pacienteId },
    });
    if (!p) {
      throw new NotFoundException('Paciente no encontrado');
    }
    if (
      dto.correoElectronico &&
      dto.correoElectronico !== p.correoElectronico
    ) {
      const existe = await this.pacienteRepo.exist({
        where: { correoElectronico: dto.correoElectronico },
      });
      if (existe) {
        throw new ConflictException('El correo ya está en uso');
      }
    }
    Object.assign(p, dto);
    await this.pacienteRepo.save(p);
    return this.obtenerPerfil(pacienteId);
  }

  async cambiarPasswordPaciente(
    pacienteId: number,
    dto: CambiarPasswordDto,
  ): Promise<{ ok: true }> {
    const cuenta = await this.cuentaRepo.findOne({
      where: { paciente: { pacienteID: pacienteId } },
      relations: ['paciente'],
    });
    if (!cuenta) {
      throw new NotFoundException('Cuenta no encontrada');
    }

    const okActual = await bcrypt.compare(dto.passwordActual, cuenta.password);
    if (!okActual) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const hash = await bcrypt.hash(dto.passwordNueva, 10);
    cuenta.password = hash;
    await this.cuentaRepo.save(cuenta);
    return { ok: true };
  }

  async buscarPacientes(q: string) {
    const t = q.trim();
    if (t.length < 2) {
      return [];
    }
    const like = `%${t}%`;
    return this.pacienteRepo
      .createQueryBuilder('p')
      .where('LOWER(p.nombre) LIKE LOWER(:like)', { like })
      .orWhere('LOWER(p.apellido_pat) LIKE LOWER(:like)', { like })
      .orWhere('LOWER(p.apellido_mat) LIKE LOWER(:like)', { like })
      .orWhere('LOWER(p.correoElectronico) LIKE LOWER(:like)', { like })
      .orWhere('UPPER(p.curp) LIKE UPPER(:pref)', {
        pref: `${t.toUpperCase()}%`,
      })
      .orderBy('p.pacienteID', 'DESC')
      .take(25)
      .getMany();
  }
}
