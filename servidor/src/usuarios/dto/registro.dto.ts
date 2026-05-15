import { IsEmail, IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegistroDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().slice(0, 50) : value,
  )
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(50)
  nombre!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().slice(0, 15) : value,
  )
  @IsString()
  @MinLength(1, { message: 'El apellido paterno es obligatorio' })
  @MaxLength(15)
  apellido_pat!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().slice(0, 15) : value,
  )
  @IsString()
  @MinLength(1, { message: 'El apellido materno es obligatorio' })
  @MaxLength(15)
  apellido_mat!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  @MaxLength(150)
  correoElectronico!: string;

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
  @IsIn(['M', 'F', 'X', 'OTRO'], {
    message: 'genero debe ser M, F, X u OTRO',
  })
  @MaxLength(10)
  genero!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Matches(/^[A-Z0-9]{18}$/, {
    message: 'CURP inválida: debe tener 18 caracteres alfanuméricos en mayúsculas',
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
