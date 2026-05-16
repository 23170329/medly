import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Especialidad } from '../../especialidades/entities/especialidad.entity';
import { MedicoSucursal } from './medico-sucursal.entity';

@Entity('medico')
export class Medico {
  @PrimaryGeneratedColumn()
  medicoID!: number;

  @Column({ type: 'varchar', length: 80 })
  nombre!: string;

  @Column({ type: 'varchar', length: 40 })
  apellidoPat!: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  apellidoMat!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cedula!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precioConsulta!: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: '0' })
  promedioCalificacion!: string;

  @Column({ type: 'int', default: 0 })
  totalResenas!: number;

  @Column({ type: 'int' })
  especialidadID!: number;

  @ManyToOne(() => Especialidad, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'especialidadID' })
  especialidad!: Especialidad;

  @OneToMany(() => MedicoSucursal, (ms) => ms.medico)
  sucursales!: MedicoSucursal[];
}
