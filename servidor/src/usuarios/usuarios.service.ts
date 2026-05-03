import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from './entities/paciente.entity';
import { CuentaUsuario } from './entities/cuenta-usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
    @InjectRepository(CuentaUsuario)
    private readonly cuentaRepo: Repository<CuentaUsuario>,
  ) {}

  async registrarPaciente(datos: any) {
    // 1. Creamos y guardamos el Paciente
    const nuevoPaciente = this.pacienteRepo.create({
      nombre: datos.nombre,
      apellido_pat: datos.apellido_pat,
      apellido_mat: datos.apellido_mat,
      correoElectronico: datos.correoElectronico,
      telefono: datos.telefono,
      fechaNacimiento: datos.fechaNacimiento,
      genero: datos.genero,
    });
    const pacienteGuardado = await this.pacienteRepo.save(nuevoPaciente);

    // 2. Creamos la Cuenta vinculada a ese Paciente
    const nuevaCuenta = this.cuentaRepo.create({
      password: datos.password, // Nota: Más adelante añadiremos encriptación
      paciente: pacienteGuardado,
      esInvitado: false,
    });

    return await this.cuentaRepo.save(nuevaCuenta);
  }
}