import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('medico')
export class Medico {
  @PrimaryGeneratedColumn()
  medicoID!: number;

  @Column({ type: 'varchar', length: 50 })
  nombre!: string;

  @Column({ type: 'varchar', length: 15 })
  apellido_pat!: string;

  @Column({ type: 'varchar', length: 15 })
  apellido_mat!: string;

  @Column({ type: 'varchar', length: 100 })
  especialidad!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  cedulaProfesional!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  correoElectronico!: string;

  @Column({ type: 'varchar', length: 10 })
  telefono!: string;

  @Column({ type: 'varchar', length: 50 })
  contrasena!: string; 

  @Column({ type: 'varchar', length: 255, nullable: true })
  rutaFirmaDigital!: string;

  @Column({ type: 'varchar', length: 10, default: 'Activo' })
  estado!: string;
}