import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class BloquearHorarioDto {
  @IsISO8601()
  inicio!: string;

  @IsISO8601()
  fin!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  motivo?: string;
}

