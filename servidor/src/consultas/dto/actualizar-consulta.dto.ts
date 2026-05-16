import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Actualización parcial de notas clínicas (NOM-004). */
export class ActualizarConsultaDto {
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
}
