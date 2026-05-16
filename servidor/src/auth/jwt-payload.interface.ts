export type JwtSubjectKind = 'paciente' | 'staff';

export type RolStaffJwt = 'RECEPCIONISTA' | 'MEDICO';

/** Payload del access token (paciente o personal). */
export interface JwtPayload {
  sub: number;
  email: string;
  kind: JwtSubjectKind;
  /** Solo pacientes */
  cuentaId?: number;
  /** Solo staff */
  rol?: RolStaffJwt;
  /** Solo médicos (staff con rol MEDICO) */
  medicoId?: number;
}
