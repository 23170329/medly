import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('especialidad')
export class Especialidad {
  @PrimaryGeneratedColumn()
  especialidadID!: number;

  @Column({ type: 'varchar', length: 80, unique: true })
  nombre!: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  icono!: string | null;
}
