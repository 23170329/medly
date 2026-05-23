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

  @Column({ type: 'varchar', length: 40, nullable: true })
  tipo!: string | null;

  @Column({ type: 'int', nullable: true })
  citaID!: number | null;

  @Column({ type: 'int', nullable: true })
  medicoID!: number | null;

  @Column({ type: 'int', nullable: true })
  sucursalID!: number | null;

  @Column({ type: 'boolean', default: false })
  permiteReagendar!: boolean;

  @CreateDateColumn()
  fechaCreacion!: Date;

  @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pacienteID' })
  paciente!: Paciente;
}
