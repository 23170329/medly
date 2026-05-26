import { IsString, MaxLength, MinLength } from 'class-validator';

export class CambiarPasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  passwordActual!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  passwordNueva!: string;
}

