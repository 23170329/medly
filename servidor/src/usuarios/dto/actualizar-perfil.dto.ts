import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ActualizarPerfilDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellido_pat?: string;

  @IsOptional()
  @IsString()
  apellido_mat?: string;

  @IsOptional()
  @IsEmail()
  correoElectronico?: string;

  @IsOptional()
  @IsString()
  telefono?: string;
}
