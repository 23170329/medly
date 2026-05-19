import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtPayload } from '../jwt-payload.interface';

@Injectable()
export class PatientOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const u = req.user;
    if (!u || u.kind !== 'paciente') {
      throw new ForbiddenException(
        'Esta operación solo está disponible para pacientes',
      );
    }
    return true;
  }
}
