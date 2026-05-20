import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Paciente } from './entities/paciente.entity';
import { CuentaUsuario } from './entities/cuenta-usuario.entity';
import { RegistroDto } from './dto/registro.dto';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
    @InjectRepository(CuentaUsuario)
    private readonly cuentaRepo: Repository<CuentaUsuario>,
  ) {}

  async registrarPaciente(datos: RegistroDto) {
    const correoNorm = datos.correoElectronico.trim().toLowerCase();
    if (/@medly\./i.test(correoNorm)) {
      throw new BadRequestException(
        'No se permiten correos con dominio @medly',
      );
    }
    const duplicado = await this.pacienteRepo
      .createQueryBuilder('p')
      .where('LOWER(TRIM(p.correoElectronico)) = :correo', {
        correo: correoNorm,
      })
      .getCount();
    if (duplicado > 0) {
      throw new ConflictException('El correo ya está registrado');
    }

    const curpNorm = datos.curp.trim().toUpperCase();
    const curpDup = await this.pacienteRepo.exist({
      where: { curp: curpNorm },
    });
    if (curpDup) {
      throw new ConflictException('La CURP ya está registrada');
    }

    const hash = await bcrypt.hash(datos.password, 10);

    const nuevoPaciente = this.pacienteRepo.create({
      nombre: datos.nombre,
      apellido_pat: datos.apellido_pat,
      apellido_mat: datos.apellido_mat,
      correoElectronico: correoNorm,
      telefono: datos.telefono,
      fechaNacimiento: datos.fechaNacimiento,
      genero: datos.genero,
      curp: curpNorm,
    });
    const pacienteGuardado = await this.pacienteRepo.save(nuevoPaciente);

    const nuevaCuenta = this.cuentaRepo.create({
      password: hash,
      paciente: pacienteGuardado,
      esInvitado: false,
    });

    return await this.cuentaRepo.save(nuevaCuenta);
  }

  async obtenerPerfil(pacienteId: number) {
    const p = await this.pacienteRepo.findOne({
      where: { pacienteID: pacienteId },
    });
    if (!p) {
      throw new NotFoundException('Paciente no encontrado');
    }
    const apellido = [p.apellido_pat, p.apellido_mat].filter(Boolean).join(' ');
    return {
      pacienteID: p.pacienteID,
      nombre: p.nombre,
      apellido_pat: p.apellido_pat,
      apellido_mat: p.apellido_mat,
      apellido,
      correoElectronico: p.correoElectronico,
      telefono: p.telefono,
      fechaNacimiento: p.fechaNacimiento,
      genero: p.genero,
      curp: p.curp,
    };
  }

  async actualizarPerfil(pacienteId: number, dto: ActualizarPerfilDto) {
    const p = await this.pacienteRepo.findOne({
      where: { pacienteID: pacienteId },
    });
    if (!p) {
      throw new NotFoundException('Paciente no encontrado');
    }
    if (
      dto.correoElectronico &&
      dto.correoElectronico !== p.correoElectronico
    ) {
      const existe = await this.pacienteRepo.exist({
        where: { correoElectronico: dto.correoElectronico },
      });
      if (existe) {
        throw new ConflictException('El correo ya está en uso');
      }
    }
    Object.assign(p, dto);
    await this.pacienteRepo.save(p);
    return this.obtenerPerfil(pacienteId);
  }

  async buscarPacientes(q: string) {
    const t = q.trim();
    if (t.length < 2) {
      return [];
    }
    const like = `%${t}%`;
    return this.pacienteRepo
      .createQueryBuilder('p')
      .where('LOWER(p.nombre) LIKE LOWER(:like)', { like })
      .orWhere('LOWER(p.apellido_pat) LIKE LOWER(:like)', { like })
      .orWhere('LOWER(p.apellido_mat) LIKE LOWER(:like)', { like })
      .orWhere('LOWER(p.correoElectronico) LIKE LOWER(:like)', { like })
      .orWhere('UPPER(p.curp) LIKE UPPER(:pref)', {
        pref: `${t.toUpperCase()}%`,
      })
      .orderBy('p.pacienteID', 'DESC')
      .take(25)
      .getMany();
  }
}
