import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Medico } from '../../medicos/entities/medico.entity';
import { Sucursal } from '../../sucursales/entities/sucursal.entity';
import { EstadoSlot } from '../../common/enums';

@Entity('slot_agenda')
@Index(['medicoID', 'inicio'])
@Index(['estado'])
export class SlotAgenda {
  @PrimaryGeneratedColumn()
  slotID!: number;

  @Column({ type: 'int' })
  medicoID!: number;

  @Column({ type: 'int' })
  sucursalID!: number;

  @Column({ type: 'timestamptz' })
  inicio!: Date;

  @Column({ type: 'timestamptz' })
  fin!: Date;

  @Column({
    type: 'enum',
    enum: EstadoSlot,
    enumName: 'slot_agenda_estado_enum',
    default: EstadoSlot.LIBRE,
  })
  estado!: EstadoSlot;

  @ManyToOne(() => Medico, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicoID' })
  medico!: Medico;

  @ManyToOne(() => Sucursal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sucursalID' })
  sucursal!: Sucursal;
}
