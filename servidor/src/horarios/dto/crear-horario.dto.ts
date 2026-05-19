import { IsInt, IsString, Matches, Min } from 'class-validator';

export class CrearHorarioDto {
  @IsInt()
  @Min(1)
  medicoID!: number;

  @IsInt()
  @Min(1)
  consultorioID!: number;

  @IsString()
  diaSemana!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/)
  horaInicio!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/)
  horaFin!: string;
}
