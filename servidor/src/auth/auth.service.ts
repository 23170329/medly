import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CuentaUsuario } from '../usuarios/entities/cuenta-usuario.entity';
import { Paciente } from '../usuarios/entities/paciente.entity';
import { CuentaStaff } from '../staff/entities/cuenta-staff.entity';
import { Medico } from '../medicos/entities/medico.entity';
import { JwtPayload } from './jwt-payload.interface';
import {
  esCurp,
  esTelefono,
  normalizarIdentificadorLogin,
} from './identificador-login.util';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RegistroDto } from '../usuarios/dto/registro.dto';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { Request } from 'express';

export type AuthUsuarioResponse =
  | {
      id: string;
      email: string;
      rol: 'PACIENTE';
      pacienteId: number;
      nombre: string;
      apellido: string;
    }
  | {
      id: string;
      email: string;
      rol: 'RECEPCIONISTA';
      staffId: number;
      nombre: string;
      sucursalId?: number;
      sucursalNombre?: string;
    }
  | {
      id: string;
      email: string;
      rol: 'MEDICO';
      staffId: number;
      medicoId: number;
      nombre: string;
    };

export interface AuthTokensResponse {
  mensaje: string;
  access_token: string;
  refresh_token: string;
  usuario: AuthUsuarioResponse;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(CuentaUsuario)
    private readonly cuentaUsuarioRepository: Repository<CuentaUsuario>,
    @InjectRepository(CuentaStaff)
    private readonly cuentaStaffRepository: Repository<CuentaStaff>,
    @InjectRepository(Medico)
    private readonly medicoRepository: Repository<Medico>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly usuariosService: UsuariosService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  private refreshSecret(): string {
    return (
      this.config.get<string>('JWT_REFRESH_SECRET') ??
      `${this.config.getOrThrow<string>('JWT_SECRET')}:refresh`
    );
  }

  private buildUsuarioPaciente(
    p: Paciente,
    cuenta: CuentaUsuario,
  ): AuthUsuarioResponse {
    const apellido = [p.apellido_pat, p.apellido_mat].filter(Boolean).join(' ');
    return {
      id: cuenta.cuentaID.toString(),
      pacienteId: p.pacienteID,
      nombre: p.nombre,
      apellido,
      email: p.correoElectronico,
      rol: 'PACIENTE',
    };
  }

  /** Repara cuentas MEDICO sin ficha vinculada (p. ej. seed incompleto en producción). */
  private async asegurarVinculoMedicoStaff(s: CuentaStaff): Promise<CuentaStaff> {
    if (s.rol !== 'MEDICO' || s.medico?.medicoID != null) {
      return s;
    }
    const med =
      (await this.medicoRepository.findOne({ where: { cedula: 'CED001' } })) ??
      (await this.medicoRepository.find({ order: { medicoID: 'ASC' }, take: 1 }))[0];
    if (!med) {
      throw new BadRequestException(
        'Cuenta de médico sin vínculo. Ejecuta npm run seed en el servidor o contacta soporte.',
      );
    }
    s.medico = med;
    await this.cuentaStaffRepository.save(s);
    return s;
  }

  private buildUsuarioStaff(s: CuentaStaff): AuthUsuarioResponse {
    if (s.rol === 'MEDICO') {
      const mid = s.medico?.medicoID;
      if (mid == null) {
        throw new BadRequestException(
          'Cuenta de médico sin vínculo a ficha de médico',
        );
      }
      return {
        id: s.cuentaStaffID.toString(),
        staffId: s.cuentaStaffID,
        medicoId: mid,
        nombre: s.nombre,
        email: s.correo,
        rol: 'MEDICO',
      };
    }
    return {
      id: s.cuentaStaffID.toString(),
      staffId: s.cuentaStaffID,
      nombre: s.nombre,
      email: s.correo,
      rol: 'RECEPCIONISTA',
      sucursalId: s.sucursalID ?? undefined,
      sucursalNombre: s.sucursal?.nombre ?? undefined,
    };
  }

  private async signAccessTokenPaciente(p: Paciente, cuenta: CuentaUsuario) {
    const payload: JwtPayload = {
      sub: p.pacienteID,
      cuentaId: cuenta.cuentaID,
      email: p.correoElectronico,
      kind: 'paciente',
    };
    const accessExp = this.config.get<string>('JWT_EXPIRES_IN') ?? '15m';
    return this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: accessExp as never,
    });
  }

  private async signRefreshTokenPaciente(pacienteId: number, cuentaId: number) {
    const refreshExp =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    return this.jwtService.signAsync(
      {
        sub: pacienteId,
        cuentaId,
        typ: 'refresh',
        kind: 'paciente',
      },
      {
        secret: this.refreshSecret(),
        expiresIn: refreshExp as never,
      },
    );
  }

  private async emitAuthTokensPaciente(
    p: Paciente,
    cuenta: CuentaUsuario,
    mensaje: string,
  ): Promise<AuthTokensResponse> {
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessTokenPaciente(p, cuenta),
      this.signRefreshTokenPaciente(p.pacienteID, cuenta.cuentaID),
    ]);
    return {
      mensaje,
      access_token,
      refresh_token,
      usuario: this.buildUsuarioPaciente(p, cuenta),
    };
  }

  private async signAccessTokenStaff(s: CuentaStaff) {
    const payload: JwtPayload = {
      sub: s.cuentaStaffID,
      email: s.correo,
      kind: 'staff',
      rol: s.rol,
      medicoId: s.medico?.medicoID ?? undefined,
    };
    const accessExp = this.config.get<string>('JWT_EXPIRES_IN') ?? '15m';
    return this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: accessExp as never,
    });
  }

  private async signRefreshTokenStaff(s: CuentaStaff) {
    const refreshExp =
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    return this.jwtService.signAsync(
      {
        sub: s.cuentaStaffID,
        typ: 'refresh',
        kind: 'staff',
        rol: s.rol,
        medicoId: s.medico?.medicoID ?? undefined,
      },
      {
        secret: this.refreshSecret(),
        expiresIn: refreshExp as never,
      },
    );
  }

  private async emitAuthTokensStaff(
    s: CuentaStaff,
    mensaje: string,
  ): Promise<AuthTokensResponse> {
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessTokenStaff(s),
      this.signRefreshTokenStaff(s),
    ]);
    return {
      mensaje,
      access_token,
      refresh_token,
      usuario: this.buildUsuarioStaff(s),
    };
  }

  async registrar(
    dto: RegistroDto,
    req?: Request,
  ): Promise<AuthTokensResponse> {
    await this.usuariosService.registrarPaciente(dto);
    const correoNorm = dto.correoElectronico.trim().toLowerCase();
    const paciente = await this.cuentaUsuarioRepository.manager
      .createQueryBuilder(Paciente, 'p')
      .innerJoinAndSelect('p.cuenta', 'c')
      .where('LOWER(TRIM("p"."correoElectronico")) = :email', {
        email: correoNorm,
      })
      .getOne();
    if (!paciente?.cuenta) {
      throw new BadRequestException('No se pudo completar el registro');
    }

    await this.auditoriaService.registrar({
      tipo: 'REGISTRO_USUARIO',
      descripcion: `Registro de ${correoNorm}`,
      usuarioID: paciente.pacienteID,
      req,
    });

    return this.emitAuthTokensPaciente(
      paciente,
      paciente.cuenta,
      'Registro exitoso',
    );
  }

  async refreshSession(refreshToken: string): Promise<AuthTokensResponse> {
    let decoded: {
      sub: number;
      cuentaId?: number;
      typ?: string;
      kind?: string;
      rol?: 'RECEPCIONISTA' | 'MEDICO';
      medicoId?: number;
    };
    try {
      decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.refreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
    if (decoded.typ !== 'refresh') {
      throw new UnauthorizedException('Token no válido para renovación');
    }

    const kind = decoded.kind ?? 'paciente';
    if (kind === 'staff') {
      const staff = await this.cuentaStaffRepository.findOne({
        where: { cuentaStaffID: decoded.sub },
        relations: ['medico', 'sucursal'],
      });
      if (!staff || staff.rol !== decoded.rol) {
        throw new UnauthorizedException('Sesión no válida');
      }
      const staffListo = await this.asegurarVinculoMedicoStaff(staff);
      return this.emitAuthTokensStaff(staffListo, 'Sesión renovada');
    }

    if (decoded.cuentaId == null) {
      throw new UnauthorizedException('Sesión no válida');
    }
    const paciente = await this.cuentaUsuarioRepository.manager.findOne(
      Paciente,
      {
        where: { pacienteID: decoded.sub },
        relations: ['cuenta'],
      },
    );
    if (!paciente?.cuenta || paciente.cuenta.cuentaID !== decoded.cuentaId) {
      throw new UnauthorizedException('Sesión no válida');
    }
    return this.emitAuthTokensPaciente(
      paciente,
      paciente.cuenta,
      'Sesión renovada',
    );
  }

  private soloDigitos(valor: string): string {
    return valor.replace(/\D/g, '');
  }

  private normalizarTelefonoMx(valor: string): string {
    let d = this.soloDigitos(valor);
    if (d.length === 12 && d.startsWith('52')) d = d.slice(2);
    if (d.length === 13 && d.startsWith('521')) d = d.slice(3);
    return d;
  }

  private async buscarPacientePorIdentificador(
    identificador: string,
  ): Promise<Paciente | null> {
    const id = normalizarIdentificadorLogin(identificador);
    if (!id) return null;

    const telExpr = `REGEXP_REPLACE(COALESCE(p.telefono, ''), '[^0-9]', '', 'g')`;
    const qb = this.cuentaUsuarioRepository.manager
      .createQueryBuilder(Paciente, 'p')
      .innerJoinAndSelect('p.cuenta', 'c');

    if (id.includes('@')) {
      qb.where('LOWER(TRIM(p.correoElectronico)) = :email', {
        email: id.toLowerCase(),
      });
    } else if (esCurp(id)) {
      qb.where('UPPER(TRIM(p.curp)) = :curp', { curp: id });
    } else if (esTelefono(id)) {
      const tel = this.normalizarTelefonoMx(id);
      qb.where(
        `(${telExpr} = :tel OR ${telExpr} = :tel52 OR ${telExpr} = :tel521)`,
        {
          tel,
          tel52: `52${tel}`,
          tel521: `521${tel}`,
        },
      );
    } else {
      return null;
    }

    return qb.getOne();
  }

  private async buscarStaffPorCorreo(correo: string): Promise<CuentaStaff | null> {
    const email = correo.trim().toLowerCase();
    return this.cuentaStaffRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.medico', 'medico')
      .leftJoinAndSelect('s.sucursal', 'sucursal')
      .where('LOWER(TRIM(s.correo)) = :email', { email })
      .getOne();
  }

  private async verificarContrasenaStaff(
    plano: string,
    almacenada: string,
  ): Promise<boolean> {
    if (!almacenada) return false;
    if (/^\$2[aby]\$/.test(almacenada)) {
      return bcrypt.compare(plano, almacenada);
    }
    return plano === almacenada;
  }

  private async migrarContrasenaStaffSiPlano(
    staff: CuentaStaff,
    contrasena: string,
  ): Promise<void> {
    if (/^\$2[aby]\$/.test(staff.password)) return;
    staff.password = await bcrypt.hash(contrasena, 10);
    await this.cuentaStaffRepository.save(staff);
  }

  private async intentarLoginStaff(
    correo: string,
    contrasena: string,
    req?: Request,
  ): Promise<AuthTokensResponse | null> {
    const staff = await this.buscarStaffPorCorreo(correo);
    if (!staff) return null;

    const ok = await this.verificarContrasenaStaff(contrasena, staff.password);
    if (!ok) {
      throw new UnauthorizedException(
        'Correo, CURP o teléfono incorrectos, o contraseña incorrecta',
      );
    }
    await this.migrarContrasenaStaffSiPlano(staff, contrasena);
    const staffListo = await this.asegurarVinculoMedicoStaff(staff);
    await this.auditoriaService.registrar({
      tipo: 'LOGIN_EXITOSO',
      descripcion: `Staff ${staffListo.correo} (${staffListo.rol})`,
      usuarioID: staffListo.cuentaStaffID,
      req,
    });
    return this.emitAuthTokensStaff(staffListo, 'Login exitoso');
  }

  async validarUsuario(
    identificador: string,
    contrasena: string,
    req?: Request,
  ): Promise<AuthTokensResponse> {
    const idLogin = normalizarIdentificadorLogin(identificador);

    if (idLogin.includes('@')) {
      const staffLogin = await this.intentarLoginStaff(idLogin, contrasena, req);
      if (staffLogin) return staffLogin;
    }

    const paciente = await this.buscarPacientePorIdentificador(idLogin);

    if (paciente?.cuenta) {
      const ok = await bcrypt.compare(contrasena, paciente.cuenta.password);
      if (ok) {
        await this.auditoriaService.registrar({
          tipo: 'LOGIN_EXITOSO',
          descripcion: `Paciente ${paciente.correoElectronico}`,
          usuarioID: paciente.pacienteID,
          req,
        });
        return this.emitAuthTokensPaciente(
          paciente,
          paciente.cuenta,
          'Login exitoso',
        );
      }
    }

    await this.auditoriaService.registrar({
      tipo: 'LOGIN_FALLIDO',
      descripcion: `Intento fallido para "${identificador}"`,
      req,
    });

    if (process.env.LOGIN_DEBUG === 'true') {
      this.logger.warn(`Login fallido para "${identificador}"`);
    }
    throw new UnauthorizedException(
      'Correo, CURP o teléfono incorrectos, o contraseña incorrecta',
    );
  }
}
