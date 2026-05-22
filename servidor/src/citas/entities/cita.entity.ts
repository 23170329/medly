import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Paciente } from '../../usuarios/entities/paciente.entity';
import { Medico } from '../../medicos/entities/medico.entity';
import { Sucursal } from '../../sucursales/entities/sucursal.entity';
import { SlotAgenda } from '../../horarios/entities/slot-agenda.entity';
import { EstadoCita } from '../../common/enums';
import { Pago } from '../../pagos/entities/pago.entity';

@Entity('cita')
@Index(['pacienteID', 'inicio'])
@Index(['medicoID', 'inicio'])
@Index(['estado'])
export class Cita {
  @PrimaryGeneratedColumn()
  citaID!: number;

  @Column({ type: 'int' })
  pacienteID!: number;

  @Column({ type: 'int' })
  medicoID!: number;

  @Column({ type: 'int' })
  sucursalID!: number;

  @Column({ type: 'int', unique: true })
  slotID!: number;

  @Column({ type: 'timestamptz' })
  inicio!: Date;

  @Column({ type: 'timestamptz' })
  fin!: Date;

  @Column({
    type: 'enum',
    enum: EstadoCita,
    enumName: 'cita_estado_enum',
    default: EstadoCita.PENDIENTE_PAGO,
  })
  estado!: EstadoCita;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montoTotal!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montoAnticipo!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  causaCancelacion!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  motivoCancelacion!: string | null;

  @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pacienteID' })
  paciente!: Paciente;

  @ManyToOne(() => Medico, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'medicoID' })
  medico!: Medico;

  @ManyToOne(() => Sucursal, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sucursalID' })
  sucursal!: Sucursal;

  @ManyToOne(() => SlotAgenda, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'slotID' })
  slot!: SlotAgenda;

  @OneToMany(() => Pago, (p) => p.cita)
  pagos!: Pago[];
}
