import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Cita } from '../../citas/entities/cita.entity';
import { EstadoPago, TipoPago } from '../../common/enums';

@Entity('pago')
@Index(['stripeCheckoutSessionId'])
export class Pago {
  @PrimaryGeneratedColumn()
  pagoID!: number;

  @Column({ type: 'int' })
  citaID!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeCheckoutSessionId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto!: string;

  @Column({ type: 'enum', enum: TipoPago, enumName: 'pago_tipo_enum' })
  tipo!: TipoPago;

  @Column({
    type: 'enum',
    enum: EstadoPago,
    enumName: 'pago_estado_enum',
    default: EstadoPago.PENDIENTE,
  })
  estado!: EstadoPago;

  @ManyToOne(() => Cita, (c) => c.pagos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'citaID' })
  cita!: Cita;
}
