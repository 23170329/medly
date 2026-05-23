import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Medico } from '../../medicos/entities/medico.entity';

@Entity('notificacion_medico')
export class NotificacionMedico {
  @PrimaryGeneratedColumn()
  notificacionID!: number;

  @Column({ type: 'int' })
  medicoID!: number;

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

  @Column({ type: 'boolean', default: false })
  permiteReagendar!: boolean;

  @CreateDateColumn()
  fechaCreacion!: Date;

  @ManyToOne(() => Medico, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicoID' })
  medico!: Medico;
}
