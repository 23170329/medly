import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Medico } from './medico.entity';

@Entity('calificacion')
export class Calificacion {
  @PrimaryGeneratedColumn()
  calificacionID!: number;

  @ManyToOne(() => Medico)
  @JoinColumn({ name: 'MedicoID' })
  medico!: Medico;

  // deberás agregar aquí un @OneToOne hacia ella.
  @Column({ type: 'int' })
  estrellas!: number; // En SQL tienes un CHECK de 1 a 5

  @Column({ type: 'text', nullable: true })
  comentario!: string;

  @CreateDateColumn() // Maneja automáticamente el GETDATE() de tu SQL
  fechaCalificacion!: Date;
}