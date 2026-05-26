import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CancelarCitaPacienteDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().slice(0, 80) : value,
  )
  @IsString()
  @MaxLength(80, {
    message: 'El motivo no puede exceder 80 caracteres',
  })
  /** Motivo opcional; se guarda en causaCancelacion (máx. 80 caracteres). */
  motivo?: string;
}
