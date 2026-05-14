import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CrearCitaMostradorDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pacienteId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  slotID!: number;
}
