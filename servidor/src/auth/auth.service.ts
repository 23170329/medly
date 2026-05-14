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
import { JwtPayload } from './jwt-payload.interface';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RegistroDto } from '../usuarios/dto/registro.dto';

export interface AuthTokensResponse {
  mensaje: string;
  access_token: string;
  refresh_token: string;
  usuario: {
    id: string;
    pacienteId: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: 'PACIENTE';
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(CuentaUsuario)
    private readonly cuentaUsuarioRepository: Repository<CuentaUsuario>,
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

  private buildUsuarioJson(p: Paciente, cuenta: CuentaUsuario) {
    const apellido = [p.apellido_pat, p.apellido_mat].filter(Boolean).join(' ');
    return {
      id: cuenta.cuentaID.toString(),
      pacienteId: p.pacienteID,
      nombre: p.nombre,
      apellido,
      email: p.correoElectronico,
      rol: 'PACIENTE' as const,
    };
  }

  private async signAccessToken(p: Paciente, cuenta: CuentaUsuario) {
    const payload: JwtPayload = {
      sub: p.pacienteID,
      cuentaId: cuenta.cuentaID,
      email: p.correoElectronico,
    };
    const accessExp = this.config.get<string>('JWT_EXPIRES_IN') ?? '15m';
    return this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: accessExp as never,
    });
  }

  private async signRefreshToken(pacienteId: number, cuentaId: number) {
    const refreshExp = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    return this.jwtService.signAsync(
      { sub: pacienteId, cuentaId, typ: 'refresh' },
      {
        secret: this.refreshSecret(),
        expiresIn: refreshExp as never,
      },
    );
  }

  private async emitAuthTokens(
    p: Paciente,
    cuenta: CuentaUsuario,
    mensaje: string,
  ): Promise<AuthTokensResponse> {
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken(p, cuenta),
      this.signRefreshToken(p.pacienteID, cuenta.cuentaID),
    ]);
    return {
      mensaje,
      access_token,
      refresh_token,
      usuario: this.buildUsuarioJson(p, cuenta),
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
    return this.emitAuthTokens(paciente, paciente.cuenta, 'Registro exitoso');
  }

  async refreshSession(refreshToken: string): Promise<AuthTokensResponse> {
    let decoded: { sub: number; cuentaId: number; typ?: string };
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
    return this.emitAuthTokens(paciente, paciente.cuenta, 'Sesión renovada');
  }

  async validarUsuario(correo: string, contrasena: string) {
    const correoNorm = correo.trim().toLowerCase();

    const paciente = await this.cuentaUsuarioRepository.manager
      .createQueryBuilder(Paciente, 'p')
      .innerJoinAndSelect('p.cuenta', 'c')
      .where('LOWER(TRIM("p"."correoElectronico")) = :email', { email: correoNorm })
      .getOne();

    if (!paciente?.cuenta) {
      if (process.env.LOGIN_DEBUG === 'true') {
        this.logger.warn(`Login: no hay paciente o cuenta para "${correoNorm}"`);
      }
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const usuario = paciente.cuenta;
    const ok = await bcrypt.compare(contrasena, usuario.password);
    if (!ok) {
      if (process.env.LOGIN_DEBUG === 'true') {
        this.logger.warn(
          `Login: contraseña no coincide para "${correoNorm}" (hash en BD: ${usuario.password?.slice(0, 7)}…)`,
        );
      }
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    return this.emitAuthTokens(paciente, usuario, 'Login exitoso');
  }
}
