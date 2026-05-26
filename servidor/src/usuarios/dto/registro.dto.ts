import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

const REGEX_SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÑáéíóúñÜü\s]+$/;

export class RegistroDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().slice(0, 50) : value,
  )
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(50)
  @Matches(REGEX_SOLO_LETRAS, {
    message: 'El nombre solo puede contener letras y espacios',
  })
  nombre!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().slice(0, 15) : value,
  )
  @IsString()
  @MinLength(1, { message: 'El apellido paterno es obligatorio' })
  @MaxLength(15)
  @Matches(REGEX_SOLO_LETRAS, {
    message: 'El apellido paterno solo puede contener letras y espacios',
  })
  apellido_pat!: string;

  @Transform(({ value }) => {
    if (value == null || String(value).trim() === '') return undefined;
    return typeof value === 'string' ? value.trim().slice(0, 15) : value;
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  @Matches(REGEX_SOLO_LETRAS, {
    message: 'El apellido materno solo puede contener letras y espacios',
  })
  apellido_mat?: string;

  @Transform(({ value }) => {
    if (value == null || value === '') return '';
    return typeof value === 'string' ? value.trim().toLowerCase() : value;
  })
  @IsOptional()
  @ValidateIf((o: RegistroDto) => Boolean(o.correoElectronico?.trim()))
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  @MaxLength(150)
  @Matches(/^(?!.*@medly\.).*$/i, {
    message: 'No se permiten correos con dominio @medly',
  })
  correoElectronico?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 15) : value,
  )
  @Matches(/^\d{10}$/, {
    message: 'El teléfono debe tener exactamente 10 dígitos',
  })
  telefono!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechaNacimiento debe ser YYYY-MM-DD',
  })
  fechaNacimiento!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsIn(['H', 'M'], {
    message: 'genero debe ser H (hombre) o M (mujer)',
  })
  @MaxLength(10)
  genero!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(/^[A-Z0-9]{18}$/, {
    message:
      'CURP inválida: debe tener 18 caracteres alfanuméricos en mayúsculas',
  })
  curp!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72)
  @Matches(/^(?=.*[A-Za-zÁÉÍÓÚÑáéíóúñ])(?=.*\d).{8,}$/, {
    message: 'La contraseña debe incluir al menos una letra y un número',
  })
  password!: string;
}
