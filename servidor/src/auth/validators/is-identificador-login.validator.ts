import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  esCurp,
  esTelefono,
  normalizarIdentificadorLogin,
} from '../identificador-login.util';

@ValidatorConstraint({ name: 'IsIdentificadorLogin', async: false })
export class IsIdentificadorLoginConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const n = normalizarIdentificadorLogin(value);
    if (!n) return false;
    if (n.includes('@')) {
      if (/^[^\s@]+@medly\.(d|r)$/i.test(n)) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(n);
    }
    if (esCurp(n)) return true;
    return esTelefono(n);
  }

  defaultMessage(): string {
    return 'Ingresa un correo válido, CURP (18 caracteres) o teléfono (10 dígitos)';
  }
}

export function IsIdentificadorLogin(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsIdentificadorLoginConstraint,
    });
  };
}
