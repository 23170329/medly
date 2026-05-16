import { SetMetadata } from '@nestjs/common';
import type { RolStaffJwt } from '../jwt-payload.interface';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: RolStaffJwt[]) => SetMetadata(ROLES_KEY, roles);
