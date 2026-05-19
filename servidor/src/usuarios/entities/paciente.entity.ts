import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { CuentaUsuario } from './cuenta-usuario.entity';

@Entity('paciente')
export class Paciente {
  @PrimaryGeneratedColumn()
  pacienteID!: number;

  @Column({ type: 'varchar', length: 50 })
  nombre!: string;

  @Column({ type: 'varchar', length: 15 })
  apellido_pat!: string;

  @Column({ type: 'varchar', length: 15 })
  apellido_mat!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  correoElectronico!: string;

  @Column({ type: 'varchar', length: 15 })
  telefono!: string;

  @Column({ type: 'date' })
  fechaNacimiento!: string;

  @Column({ type: 'varchar', length: 10 })
  genero!: string;

  @Column({ type: 'varchar', length: 18, unique: true })
  curp!: string;

  @OneToOne(() => CuentaUsuario, (cuenta) => cuenta.paciente)
  cuenta!: CuentaUsuario;
}
