import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { JwtPayload, RolStaffJwt } from '../jwt-payload.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const u = req.user;
    if (!u || u.kind !== 'staff' || !u.rol) {
      throw new ForbiddenException('Se requiere cuenta de personal autorizado');
    }
    const required = this.reflector.getAllAndOverride<RolStaffJwt[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) {
      return true;
    }
    if (!required.includes(u.rol)) {
      throw new ForbiddenException('No tienes permiso para esta acción');
    }
    return true;
  }
}
