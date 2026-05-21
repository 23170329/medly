import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';
import { normalizarIdentificadorLogin } from '../identificador-login.util';
import { IsIdentificadorLogin } from '../validators/is-identificador-login.validator';

/** Login paciente: identificador explícito (evita validación legacy de "correo"). */
export class LoginPacienteDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? normalizarIdentificadorLogin(value) : value,
  )
  @IsString()
  @MinLength(1)
  @IsIdentificadorLogin()
  identificador!: string;

  @IsString()
  @MinLength(1)
  contrasena!: string;
}
