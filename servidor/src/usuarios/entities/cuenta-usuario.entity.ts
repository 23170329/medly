import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Paciente } from './paciente.entity';

@Entity('cuenta_usuario')
export class CuentaUsuario {
  @PrimaryGeneratedColumn()
  cuentaID!: number;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'boolean', default: false })
  esInvitado!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  fechaExpiracion!: Date;

  @OneToOne(() => Paciente, (paciente) => paciente.cuenta)
  @JoinColumn({ name: 'pacienteID' })
  paciente!: Paciente;
}
