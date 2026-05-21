import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ContentTypeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest();
    const method = req.method.toUpperCase();

    if (['POST', 'PATCH', 'PUT'].includes(method)) {
      const ct = req.headers['content-type'] ?? '';
      if (!ct.includes('application/json')) {
        throw new BadRequestException(
          'Content-Type debe ser application/json',
        );
      }
    }
    return true;
  }
}
