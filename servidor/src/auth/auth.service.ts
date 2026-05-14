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
import { JwtPayload } from './jwt-payload.interface';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RegistroDto } from '../usuarios/dto/registro.dto';

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
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {}

  private refreshSecret(): string {
    return (
      this.config.get<string>('JWT_REFRESH_SECRET') ??
      `${this.config.getOrThrow<string>('JWT_SECRET')}:refresh`
    );
  }

  private buildUsuarioPaciente(p: Paciente, cuenta: CuentaUsuario): AuthUsuarioResponse {
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

  private buildUsuarioStaff(s: CuentaStaff): AuthUsuarioResponse {
    if (s.rol === 'MEDICO') {
      const mid = s.medico?.medicoID;
      if (mid == null) {
        throw new BadRequestException('Cuenta de médico sin vínculo a ficha de médico');
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
    const refreshExp = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
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
    const refreshExp = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
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

  async registrar(dto: RegistroDto): Promise<AuthTokensResponse> {
    await this.usuariosService.registrarPaciente(dto);
    const correoNorm = dto.correoElectronico.trim().toLowerCase();
    const paciente = await this.cuentaUsuarioRepository.manager
      .createQueryBuilder(Paciente, 'p')
      .innerJoinAndSelect('p.cuenta', 'c')
      .where('LOWER(TRIM("p"."correoElectronico")) = :email', { email: correoNorm })
      .getOne();
    if (!paciente?.cuenta) {
      throw new BadRequestException('No se pudo completar el registro');
    }
    return this.emitAuthTokensPaciente(paciente, paciente.cuenta, 'Registro exitoso');
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
        relations: ['medico'],
      });
      if (!staff || staff.rol !== decoded.rol) {
        throw new UnauthorizedException('Sesión no válida');
      }
      return this.emitAuthTokensStaff(staff, 'Sesión renovada');
    }

    if (decoded.cuentaId == null) {
      throw new UnauthorizedException('Sesión no válida');
    }
    const paciente = await this.cuentaUsuarioRepository.manager.findOne(Paciente, {
      where: { pacienteID: decoded.sub },
      relations: ['cuenta'],
    });
    if (!paciente?.cuenta || paciente.cuenta.cuentaID !== decoded.cuentaId) {
      throw new UnauthorizedException('Sesión no válida');
    }
    return this.emitAuthTokensPaciente(paciente, paciente.cuenta, 'Sesión renovada');
  }

  async validarUsuario(correo: string, contrasena: string): Promise<AuthTokensResponse> {
    const correoNorm = correo.trim().toLowerCase();

    const paciente = await this.cuentaUsuarioRepository.manager
      .createQueryBuilder(Paciente, 'p')
      .innerJoinAndSelect('p.cuenta', 'c')
      .where('LOWER(TRIM("p"."correoElectronico")) = :email', { email: correoNorm })
      .getOne();

    if (paciente?.cuenta) {
      const ok = await bcrypt.compare(contrasena, paciente.cuenta.password);
      if (ok) {
        return this.emitAuthTokensPaciente(paciente, paciente.cuenta, 'Login exitoso');
      }
    }

    const staff = await this.cuentaStaffRepository.findOne({
      where: { correo: correoNorm },
      relations: ['medico'],
    });
    if (staff) {
      const ok = await bcrypt.compare(contrasena, staff.password);
      if (ok) {
        return this.emitAuthTokensStaff(staff, 'Login exitoso');
      }
    }

    if (process.env.LOGIN_DEBUG === 'true') {
      this.logger.warn(`Login fallido para "${correoNorm}"`);
    }
    throw new UnauthorizedException('Correo o contraseña incorrectos');
  }
}
