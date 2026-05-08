export interface JwtPayload {
  /** pacienteID */
  sub: number;
  cuentaId: number;
  email: string;
}
