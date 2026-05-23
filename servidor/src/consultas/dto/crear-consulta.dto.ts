import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CrearConsultaDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pacienteID!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  citaID?: number;

  @IsOptional()
  @IsString()
  identificacion?: string;

  @IsOptional()
  @IsString()
  antecedentes?: string;

  @IsOptional()
  @IsString()
  interrogatorio?: string;

  @IsOptional()
  @IsString()
  exploracionFisica?: string;

  @IsOptional()
  @IsString()
  diagnosticos?: string;

  @IsOptional()
  @IsString()
  tratamiento?: string;

  @IsOptional()
  @IsString()
  evolucion?: string;

  @IsOptional()
  @IsString()
  pronostico?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notasConfidenciales?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(500)
  pesoKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  @Max(2.5)
  alturaM?: number;
}
