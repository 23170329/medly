import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Medico } from '../../medicos/entities/medico.entity';

export type RolStaff = 'RECEPCIONISTA' | 'MEDICO';

@Entity('cuenta_staff')
export class CuentaStaff {
  @PrimaryGeneratedColumn()
  cuentaStaffID!: number;

  @Column({ type: 'varchar', length: 120 })
  nombre!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  correo!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'enum', enum: ['RECEPCIONISTA', 'MEDICO'] })
  rol!: RolStaff;

  @ManyToOne(() => Medico, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'medicoID' })
  medico!: Medico | null;
}
