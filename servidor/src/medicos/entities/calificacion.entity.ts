import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Medico } from './medico.entity';
import { Paciente } from '../../usuarios/entities/paciente.entity';
import { Cita } from '../../citas/entities/cita.entity';

@Entity('calificacion')
@Unique(['citaID'])
export class Calificacion {
  @PrimaryGeneratedColumn()
  calificacionID!: number;

  @Column({ type: 'int' })
  pacienteID!: number;

  @Column({ type: 'int' })
  medicoID!: number;

  @Column({ type: 'int' })
  citaID!: number;

  @Column({ type: 'int' })
  estrellas!: number;

  @Column({ type: 'text', nullable: true })
  comentario!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  fechaCalificacion!: Date;

  @ManyToOne(() => Medico, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicoID' })
  medico!: Medico;

  @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pacienteID' })
  paciente!: Paciente;

  @ManyToOne(() => Cita, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'citaID' })
  cita!: Cita;
}
