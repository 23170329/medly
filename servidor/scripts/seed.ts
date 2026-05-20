import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
import dataSource from '../data-source';
import { Especialidad } from '../src/especialidades/entities/especialidad.entity';
import { Sucursal } from '../src/sucursales/entities/sucursal.entity';
import { Medico } from '../src/medicos/entities/medico.entity';
import { MedicoSucursal } from '../src/medicos/entities/medico-sucursal.entity';
import { SlotAgenda } from '../src/horarios/entities/slot-agenda.entity';
import { EstadoSlot } from '../src/common/enums';
import { CuentaStaff } from '../src/staff/entities/cuenta-staff.entity';
import * as bcrypt from 'bcryptjs';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ESPECIALIDADES = [
  { nombre: 'Medicina General', icono: 'medkit-outline' },
  { nombre: 'Cardiología', icono: 'heart-outline' },
  { nombre: 'Pediatría', icono: 'happy-outline' },
  { nombre: 'Dermatología', icono: 'sunny-outline' },
  { nombre: 'Neurología', icono: 'pulse-outline' },
  { nombre: 'Oftalmología', icono: 'eye-outline' },
  { nombre: 'Ginecología', icono: 'female-outline' },
  { nombre: 'Psicología', icono: 'git-network-outline' },
];

const SUCURSALES = [
  {
    nombre: 'Medly Centro',
    direccion: 'Av. Principal 123, Centro',
    telefono: '6671234567',
    capacidadConsultorios: 5,
    latitud: 24.8091,
    longitud: -107.3944,
  },
  {
    nombre: 'Medly Norte',
    direccion: 'Blvd. Industrial 456',
    telefono: '6677654321',
    capacidadConsultorios: 3,
    latitud: 24.8300,
    longitud: -107.3800,
  },
  {
    nombre: 'Medly Sur',
    direccion: 'Calle Reforma 789',
    telefono: '6671112233',
    capacidadConsultorios: 4,
    latitud: 24.7900,
    longitud: -107.4100,
  },
];

async function seed(): Promise<void> {
  await dataSource.initialize();
  const espRepo = dataSource.getRepository(Especialidad);
  const sucRepo = dataSource.getRepository(Sucursal);
  const medRepo = dataSource.getRepository(Medico);
  const msRepo = dataSource.getRepository(MedicoSucursal);
  const slotRepo = dataSource.getRepository(SlotAgenda);
  const staffRepo = dataSource.getRepository(CuentaStaff);

  let especialidades = await espRepo.find();
  if (especialidades.length === 0) {
    for (const e of ESPECIALIDADES) {
      await espRepo.save(espRepo.create(e));
    }
    especialidades = await espRepo.find();
    console.log(`Insertadas ${especialidades.length} especialidades.`);
  }

  let sucursales = await sucRepo.find();
  if (sucursales.length === 0) {
    for (const s of SUCURSALES) {
      await sucRepo.save(sucRepo.create(s));
    }
    sucursales = await sucRepo.find();
    console.log(`Insertadas ${sucursales.length} sucursales.`);
  }

  const medicosCount = await medRepo.count();
  if (medicosCount === 0) {
    const card = especialidades.find((e) => e.nombre === 'Cardiología')!;
    const ped = especialidades.find((e) => e.nombre === 'Pediatría')!;
    const gen = especialidades.find((e) => e.nombre === 'Medicina General')!;

    const medicosData = [
      {
        nombre: 'Alejandra',
        apellidoPat: 'López',
        apellidoMat: 'Ruiz',
        cedula: 'CED001',
        precioConsulta: '800.00',
        especialidadID: card.especialidadID,
      },
      {
        nombre: 'Sarah',
        apellidoPat: 'Martínez',
        apellidoMat: null,
        cedula: 'CED002',
        precioConsulta: '750.00',
        especialidadID: card.especialidadID,
      },
      {
        nombre: 'John',
        apellidoPat: 'Pérez',
        apellidoMat: 'García',
        cedula: 'CED003',
        precioConsulta: '700.00',
        especialidadID: ped.especialidadID,
      },
      {
        nombre: 'Carlos',
        apellidoPat: 'Mendoza',
        apellidoMat: 'Soto',
        cedula: 'CED004',
        precioConsulta: '500.00',
        especialidadID: gen.especialidadID,
      },
    ];

    const centro = sucursales.find((s) => s.nombre.includes('Centro'))!;
    const norte = sucursales.find((s) => s.nombre.includes('Norte'))!;

    for (const m of medicosData) {
      const saved = await medRepo.save(medRepo.create(m));
      await msRepo.save(
        msRepo.create({
          medicoID: saved.medicoID,
          sucursalID: centro.sucursalID,
        }),
      );
      if (saved.medicoID % 2 === 0) {
        await msRepo.save(
          msRepo.create({
            medicoID: saved.medicoID,
            sucursalID: norte.sucursalID,
          }),
        );
      }
    }
    console.log(`Insertados ${medicosData.length} médicos y asignaciones.`);
  }

  const slotsLibres = await slotRepo.count({ where: { estado: EstadoSlot.LIBRE } });
  if (slotsLibres === 0) {
    const medicos = await medRepo.find();
    const slots: SlotAgenda[] = [];
    const horaInicio = 10;
    const horaFin = 17;
    const duracionMin = 30;

    for (let d = 0; d < 14; d++) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() + d);
      const dow = day.getDay();
      if (dow === 0 || dow === 6) continue;

      for (const med of medicos) {
        const msList = await msRepo.find({
          where: { medicoID: med.medicoID },
        });
        for (const ms of msList) {
          for (let h = horaInicio; h < horaFin; h++) {
            for (const min of [0, 30]) {
              if (h === horaFin - 1 && min === 30) continue;
              const inicio = new Date(day);
              inicio.setHours(h, min, 0, 0);
              const fin = new Date(inicio.getTime() + duracionMin * 60 * 1000);
              slots.push(
                slotRepo.create({
                  medicoID: med.medicoID,
                  sucursalID: ms.sucursalID,
                  inicio,
                  fin,
                  estado: EstadoSlot.LIBRE,
                }),
              );
            }
          }
        }
      }
    }

    const chunk = 200;
    for (let i = 0; i < slots.length; i += chunk) {
      await slotRepo.save(slots.slice(i, i + chunk));
    }
    console.log(`Insertados ${slots.length} slots de agenda.`);
  }

  const staffCount = await staffRepo.count();
  if (staffCount === 0) {
    const med = await medRepo.findOne({ where: { cedula: 'CED001' } });
    if (med) {
      const passRep = await bcrypt.hash('RecepMedly1!', 10);
      const passDoc = await bcrypt.hash('DoctorMedly1!', 10);
      await staffRepo.save(
        staffRepo.create({
          nombre: 'Recepción Demo',
          correo: 'recepcion@medly.r',
          password: passRep,
          rol: 'RECEPCIONISTA',
          medico: null,
        }),
      );
      await staffRepo.save(
        staffRepo.create({
          nombre: 'Dra. Alejandra López',
          correo: 'doctor@medly.d',
          password: passDoc,
          rol: 'MEDICO',
          medico: med,
        }),
      );
      console.log(
        'Cuentas staff: recepcion@medly.r / RecepMedly1! · doctor@medly.d / DoctorMedly1!',
      );
    }
  }

  await dataSource.destroy();
  console.log('Seed completado.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
