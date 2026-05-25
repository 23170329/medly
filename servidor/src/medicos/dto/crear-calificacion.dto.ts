import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CrearCalificacionDto {
  @IsInt()
  citaID!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  estrellas!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;
}
