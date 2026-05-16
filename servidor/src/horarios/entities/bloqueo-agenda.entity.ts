import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Medico } from '../../medicos/entities/medico.entity';

@Entity('bloqueo_agenda')
export class BloqueoAgenda {
  @PrimaryGeneratedColumn()
  bloqueoID!: number;

  @ManyToOne(() => Medico, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medicoID' })
  medico!: Medico;

  @Column({ type: 'timestamptz' })
  inicio!: Date;

  @Column({ type: 'timestamptz' })
  fin!: Date;

  @Column({ type: 'varchar', length: 300, nullable: true })
  motivo!: string | null;
}
