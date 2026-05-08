import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CuentaUsuario } from '../usuarios/entities/cuenta-usuario.entity';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(CuentaUsuario)
    private readonly cuentaUsuarioRepository: Repository<CuentaUsuario>,
    private readonly jwtService: JwtService,
  ) {}

  async validarUsuario(correo: string, contrasena: string) {
    const usuario = await this.cuentaUsuarioRepository.findOne({
      where: {
        paciente: {
          correoElectronico: correo,
        },
      },
      relations: ['paciente'],
    });

    if (!usuario || !usuario.paciente) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const ok = await bcrypt.compare(contrasena, usuario.password);
    if (!ok) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const p = usuario.paciente;
    const apellido = [p.apellido_pat, p.apellido_mat].filter(Boolean).join(' ');

    const payload: JwtPayload = {
      sub: p.pacienteID,
      cuentaId: usuario.cuentaID,
      email: p.correoElectronico,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      mensaje: 'Login exitoso',
      access_token,
      usuario: {
        id: usuario.cuentaID.toString(),
        pacienteId: p.pacienteID,
        nombre: p.nombre,
        apellido,
        email: p.correoElectronico,
        rol: 'PACIENTE' as const,
      },
    };
  }
}
