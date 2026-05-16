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

/**
 * Registro de consulta alineado a secciones típicas NOM-004-SSA3-2012
 * (identificación, antecedentes, exploración, diagnóstico, tratamiento, etc.).
 * Solo el médico autor puede ver/editar sus propias consultas (aislamiento por medicoID).
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

  @Column({ type: 'text', nullable: true })
  identificacion!: string | null;

  @Column({ type: 'text', nullable: true })
  antecedentes!: string | null;

  @Column({ type: 'text', nullable: true })
  interrogatorio!: string | null;

  @Column({ type: 'text', nullable: true })
  exploracionFisica!: string | null;

  @Column({ type: 'text', nullable: true })
  diagnosticos!: string | null;

  @Column({ type: 'text', nullable: true })
  tratamiento!: string | null;

  @Column({ type: 'text', nullable: true })
  evolucion!: string | null;

  @Column({ type: 'text', nullable: true })
  pronostico!: string | null;

  @Column({ type: 'text', nullable: true })
  notasConfidenciales!: string | null;
}
