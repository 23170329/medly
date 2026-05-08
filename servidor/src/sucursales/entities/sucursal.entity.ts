import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sucursal')
export class Sucursal {
  @PrimaryGeneratedColumn()
  sucursalID!: number;

  @Column({ type: 'varchar', length: 120, unique: true })
  nombre!: string;

  @Column({ type: 'varchar', length: 255 })
  direccion!: string;

  @Column({ type: 'varchar', length: 20 })
  telefono!: string;

  @Column({ type: 'int', default: 1 })
  capacidadConsultorios!: number;
}
