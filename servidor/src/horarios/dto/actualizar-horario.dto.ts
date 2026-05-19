import { IsInt, IsString, IsOptional, Matches, Min } from 'class-validator';

export class ActualizarHorarioDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  consultorioID?: number;

  @IsOptional()
  @IsString()
  diaSemana?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/)
  horaInicio?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/)
  horaFin?: string;
}
