import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Corregimos la importación con el guion medio exacto de tu archivo
import { CuentaUsuario } from '../usuarios/entities/cuenta-usuario.entity'; 

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(CuentaUsuario)
    private cuentaUsuarioRepository: Repository<CuentaUsuario>,
  ) {}

  async validarUsuario(correo: string, contrasena: string) {
    // 1. Buscamos la cuenta de usuario, pero filtramos usando el correo
    // que está guardado en la tabla paciente (relación)
    const usuario = await this.cuentaUsuarioRepository.findOne({
      where: { 
        paciente: {
          correoElectronico: correo // Aquí es donde realmente vive el correo
        }
      },
      relations: ['paciente'], 
    });

    // 2. Validamos que exista y checamos el 'password' (así se llama en tu entidad)
    if (!usuario || usuario.password !== contrasena) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    // 3. Regresamos los datos listos para el Zustand de React Native
    return {
      mensaje: 'Login exitoso',
      usuario: {
        id: usuario.cuentaID.toString(), // <-- AGREGA ESTA LÍNEA
        nombre: usuario.paciente.nombre,
        apellido: usuario.paciente.apellido_pat,
        email: usuario.paciente.correoElectronico,
        rol: 'PACIENTE'
      }
    };
  }
}