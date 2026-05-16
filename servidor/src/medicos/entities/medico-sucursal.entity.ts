import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Medico } from './medico.entity';
import { Sucursal } from '../../sucursales/entities/sucursal.entity';

@Entity('medico_sucursal')
export class MedicoSucursal {
  @PrimaryColumn({ type: 'int', name: 'medicoID' })
  medicoID!: number;

  @PrimaryColumn({ type: 'int', name: 'sucursalID' })
  sucursalID!: number;

  @ManyToOne(() => Medico, (m) => m.sucursales, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicoID' })
  medico!: Medico;

  @ManyToOne(() => Sucursal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sucursalID' })
  sucursal!: Sucursal;
}
