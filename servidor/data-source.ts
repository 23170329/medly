import 'reflect-metadata';
import * as path from 'path';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Paciente } from './src/usuarios/entities/paciente.entity';
import { CuentaUsuario } from './src/usuarios/entities/cuenta-usuario.entity';
import { Especialidad } from './src/especialidades/entities/especialidad.entity';
import { Sucursal } from './src/sucursales/entities/sucursal.entity';
import { Medico } from './src/medicos/entities/medico.entity';
import { MedicoSucursal } from './src/medicos/entities/medico-sucursal.entity';
import { SlotAgenda } from './src/horarios/entities/slot-agenda.entity';
import { Cita } from './src/citas/entities/cita.entity';
import { Pago } from './src/pagos/entities/pago.entity';
import { CuentaStaff } from './src/staff/entities/cuenta-staff.entity';
import { BloqueoAgenda } from './src/horarios/entities/bloqueo-agenda.entity';
import { ConsultaClinica } from './src/consultas/entities/consulta-clinica.entity';
import { Notificacion } from './src/notificaciones/entities/notificacion.entity';
import { InitialMedly1738700000000 } from './src/migrations/1738700000000-InitialMedly';
import { MedlyCurpStaffConsultas1747120000000 } from './src/migrations/1747120000000-MedlyCurpStaffConsultas';
import { PacienteApellidoMatNotNull1747130000000 } from './src/migrations/1747130000000-PacienteApellidoMatNotNull';
import { SucursalLatLng1747150000000 } from './src/migrations/1747150000000-SucursalLatLng';

dotenv.config({ path: path.join(__dirname, '.env') });

function getDbConfig() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const parsed = new URL(dbUrl);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 5432),
      username: parsed.username,
      password: parsed.password,
      database: parsed.pathname.slice(1),
    };
  }
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASS ?? 'secret',
    database: process.env.DB_NAME ?? 'medly',
  };
}

const dbConfig = getDbConfig();

export default new DataSource({
  type: 'postgres',
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  entities: [
    Paciente,
    CuentaUsuario,
    Especialidad,
    Sucursal,
    Medico,
    MedicoSucursal,
    SlotAgenda,
    BloqueoAgenda,
    Cita,
    Pago,
    ConsultaClinica,
    CuentaStaff,
    Notificacion,
  ],
  migrations: [
    InitialMedly1738700000000,
    MedlyCurpStaffConsultas1747120000000,
    PacienteApellidoMatNotNull1747130000000,
    SucursalLatLng1747150000000,
  ],
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
});
