import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type EventoAuditoria =
  | 'LOGIN_EXITOSO'
  | 'LOGIN_FALLIDO'
  | 'REGISTRO_USUARIO'
  | 'CITA_CREADA'
  | 'CITA_CANCELADA_PACIENTE'
  | 'CITA_CANCELADA_MEDICO'
  | 'PERFIL_ACTUALIZADO'
  | 'PAGO_PROCESADO'
  | 'RESERVA_ABANDONADA';

@Entity('auditoria')
export class Auditoria {
  @PrimaryGeneratedColumn()
  eventoID!: number;

  @Column({ type: 'int', nullable: true })
  usuarioID!: number | null;

  @Column({ type: 'varchar', length: 50 })
  tipo!: EventoAuditoria;

  @Column({ type: 'varchar', length: 500, nullable: true })
  descripcion!: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  direccionIP!: string | null;

  @CreateDateColumn()
  fecha!: Date;
}
