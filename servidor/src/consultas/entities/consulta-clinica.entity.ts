import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Paciente } from '../../usuarios/entities/paciente.entity';
import { Medico } from '../../medicos/entities/medico.entity';
import { Cita } from '../../citas/entities/cita.entity';
import { CifrarColumna } from '../../common/transformers/cifrado-columna.transformer';

/**
 * Registro de consulta alineado a secciones típicas NOM-004-SSA3-2012
 * con cifrado AES-256-GCM en reposo para cumplimiento LFPDPPP/NOM-024.
 * Solo el médico autor puede ver/editar sus propias consultas.
 */
@Entity('consulta_clinica')
export class ConsultaClinica {
  @PrimaryGeneratedColumn()
  consultaID!: number;

  @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pacienteID' })
  paciente!: Paciente;

  @ManyToOne(() => Medico, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicoID' })
  medico!: Medico;

  @ManyToOne(() => Cita, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'citaID' })
  cita!: Cita | null;

  @CreateDateColumn({ type: 'timestamptz' })
  fechaRegistro!: Date;

  @Column({ type: 'text', nullable: true, transformer: CifrarColumna })
  identificacion!: string | null;

  @Column({ type: 'text', nullable: true, transformer: CifrarColumna })
  antecedentes!: string | null;

  @Column({ type: 'text', nullable: true, transformer: CifrarColumna })
  interrogatorio!: string | null;

  @Column({ type: 'text', nullable: true, transformer: CifrarColumna })
  exploracionFisica!: string | null;

  @Column({ type: 'text', nullable: true, transformer: CifrarColumna })
  diagnosticos!: string | null;

  @Column({ type: 'text', nullable: true, transformer: CifrarColumna })
  tratamiento!: string | null;

  @Column({ type: 'text', nullable: true, transformer: CifrarColumna })
  evolucion!: string | null;

  @Column({ type: 'text', nullable: true, transformer: CifrarColumna })
  pronostico!: string | null;

  @Column({ type: 'text', nullable: true, transformer: CifrarColumna })
  notasConfidenciales!: string | null;
}
