import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export const CAUSAS_CANCELACION_MEDICO = [
  'EMERGENCIA_MEDICA',
  'ENFERMEDAD_MEDICO',
  'CONFLICTO_AGENDA',
  'REAGENDAMIENTO',
  'OTRO',
] as const;

export type CausaCancelacionMedico = (typeof CAUSAS_CANCELACION_MEDICO)[number];

export class CancelarCitaMedicoDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsIn(CAUSAS_CANCELACION_MEDICO, {
    message:
      'causa debe ser EMERGENCIA_MEDICA, ENFERMEDAD_MEDICO, CONFLICTO_AGENDA, REAGENDAMIENTO u OTRO',
  })
  causa!: CausaCancelacionMedico;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().slice(0, 500) : value,
  )
  @IsString()
  @MinLength(10, {
    message: 'Describe el motivo de la cancelación (mínimo 10 caracteres)',
  })
  @MaxLength(500)
  motivo!: string;
}

export function etiquetaCausaCancelacion(causa: string): string {
  const map: Record<string, string> = {
    EMERGENCIA_MEDICA: 'Emergencia médica',
    ENFERMEDAD_MEDICO: 'Enfermedad del médico',
    CONFLICTO_AGENDA: 'Conflicto de agenda',
    REAGENDAMIENTO: 'Reagendamiento',
    OTRO: 'Otro',
  };
  return map[causa] ?? causa;
}
