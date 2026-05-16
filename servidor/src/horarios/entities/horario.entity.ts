import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Medico } from '../../medicos/entities/medico.entity';
import { Consultorio } from '../../sucursales/entities/consultorio.entity';

@Entity('horario')
export class Horario {
  @PrimaryGeneratedColumn()
  horarioID!: number;

  // Relación: El horario le pertenece a un médico
  @ManyToOne(() => Medico, { nullable: false })
  @JoinColumn({ name: 'medicoID' })
  medico!: Medico;

  // Relación: El horario ocurre en un consultorio específico
  @ManyToOne(() => Consultorio, { nullable: false })
  @JoinColumn({ name: 'consultorioID' })
  consultorio!: Consultorio;

  @Column({ type: 'varchar', length: 20 })
  diaSemana!: string; // Ejemplo: 'Lunes', 'Martes'

  @Column({ type: 'time' })
  horaInicio!: string; // Ejemplo: '09:00:00'

  @Column({ type: 'time' })
  horaFin!: string; // Ejemplo: '14:00:00'
}