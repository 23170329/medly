import { IsInt, Min } from 'class-validator';

export class CrearCitaDto {
  @IsInt()
  @Min(1)
  slotID!: number;
}
