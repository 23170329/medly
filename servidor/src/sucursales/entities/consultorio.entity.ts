import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sucursal } from './sucursal.entity';

@Entity('consultorio')
export class Consultorio {
  @PrimaryGeneratedColumn()
  consultorioID!: number;

  @Column({ type: 'varchar', length: 50 })
  numeroConsultorio!: string; // Ej: "101-A", "Consultorio 5"

  @Column({ type: 'varchar', length: 50, default: 'Disponible' })
  status!: string; // 'Disponible', 'Mantenimiento', 'Ocupado'

  // Relación: Muchos consultorios pertenecen a una Sucursal
  @ManyToOne(() => Sucursal, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sucursalID' })
  sucursal!: Sucursal;
}
