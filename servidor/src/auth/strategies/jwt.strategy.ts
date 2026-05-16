import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, JwtSubjectKind } from '../jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(
    payload: JwtPayload & { kind?: JwtSubjectKind; cuentaId?: number },
  ): JwtPayload {
    const kind: JwtSubjectKind = payload.kind ?? 'paciente';
    if (kind === 'paciente') {
      if (!payload?.sub || payload.cuentaId == null) {
        throw new UnauthorizedException();
      }
      return {
        kind: 'paciente',
        sub: payload.sub,
        cuentaId: payload.cuentaId,
        email: payload.email,
      };
    }
    if (kind === 'staff') {
      if (!payload?.sub || !payload.rol) {
        throw new UnauthorizedException();
      }
      return {
        kind: 'staff',
        sub: payload.sub,
        email: payload.email,
        rol: payload.rol,
        medicoId: payload.medicoId,
      };
    }
    throw new UnauthorizedException();
  }
}
