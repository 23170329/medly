import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegistroDto {
  @IsString()
  nombre!: string;

  @IsString()
  apellido_pat!: string;

  @IsOptional()
  @IsString()
  apellido_mat?: string;

  @IsEmail()
  correoElectronico!: string;

  @IsString()
  telefono!: string;

  @IsString()
  fechaNacimiento!: string;

  @IsString()
  genero!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
