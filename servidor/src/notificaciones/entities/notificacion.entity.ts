import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Paciente } from '../../usuarios/entities/paciente.entity';

@Entity('notificacion')
export class Notificacion {
  @PrimaryGeneratedColumn()
  notificacionID!: number;

  @Column({ type: 'int' })
  pacienteID!: number;

  @Column({ type: 'varchar', length: 100 })
  titulo!: string;

  @Column({ type: 'varchar', length: 500 })
  mensaje!: string;

  @Column({ type: 'boolean', default: false })
  leida!: boolean;

  @CreateDateColumn()
  fechaCreacion!: Date;

  @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pacienteID' })
  paciente!: Paciente;
}
