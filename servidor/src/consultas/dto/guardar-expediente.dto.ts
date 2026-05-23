import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class GuardarExpedienteDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  identificacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  antecedentes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  tratamiento?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(500)
  pesoKg!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  @Max(2.5)
  alturaM!: number;
}
