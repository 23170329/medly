import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('sucursal')
export class Sucursal {
  @PrimaryGeneratedColumn()
  sucursalID!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre!: string;

  @Column({ type: 'varchar', length: 150 })
  direccion!: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  telefono!: string;

  @Column({ type: 'varchar', length: 50, default: 'Activa' })
  estado!: string; // 'Activa', 'Inactiva'

  @CreateDateColumn()
  fechaRegistro!: Date;

  @Column({ type: 'int', default: 1 })
  capacidadConsultorios!: number;
}
