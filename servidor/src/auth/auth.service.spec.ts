import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthTokensResponse } from './auth.service';
import { CuentaUsuario } from '../usuarios/entities/cuenta-usuario.entity';
import { CuentaStaff } from '../staff/entities/cuenta-staff.entity';
import { Paciente } from '../usuarios/entities/paciente.entity';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { RegistroDto } from '../usuarios/dto/registro.dto';
import { Request } from 'express';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

import * as bcrypt from 'bcryptjs';
const mockBcryptCompare = bcrypt.compare as jest.Mock;

describe('AuthService', () => {
  let service: AuthService;
  let mockQueryBuilder: {
    innerJoinAndSelect: jest.Mock;
    where: jest.Mock;
    getOne: jest.Mock;
    getMany: jest.Mock;
  };
  let mockManager: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
  };
  let mockCuentaUsuarioRepo: { manager: typeof mockManager };
  let mockCuentaStaffRepo: { findOne: jest.Mock };
  let mockJwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let mockConfigService: { get: jest.Mock; getOrThrow: jest.Mock };
  let mockUsuariosService: { registrarPaciente: jest.Mock };
  let mockAuditoriaService: { registrar: jest.Mock };

  const mockReq = { ip: '127.0.0.1', headers: {} } as Request;

  const pacienteFixture = {
    pacienteID: 1,
    nombre: 'Juan',
    apellido_pat: 'Pérez',
    apellido_mat: 'López',
    correoElectronico: 'test@example.com',
    telefono: '5512345678',
    curp: 'CURP12345678901234',
    fechaNacimiento: '1990-01-01',
    genero: 'H',
    cuenta: {
      cuentaID: 10,
      password: '$2a$10$hashedpassword',
      esInvitado: false,
      fechaExpiracion: null,
    },
  };

  const pacientePorCURP = {
    ...pacienteFixture,
    correoElectronico: 'otro@example.com',
    curp: 'ABCD123456EFGH01',
  };

  const pacientePorTelefono = {
    ...pacienteFixture,
    correoElectronico: 'phone@example.com',
    telefono: '5512345678',
    curp: 'XYZW9876543210AB',
  };

  const staffFixture = {
    cuentaStaffID: 2,
    nombre: 'Staff Name',
    correo: 'staff@medly.com',
    password: '$2a$10$hashedstaffpw',
    rol: 'RECEPCIONISTA' as const,
    medico: null,
  };

  beforeEach(async () => {
    mockBcryptCompare.mockReset();

    mockQueryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
    };

    mockManager = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn(),
    };

    mockCuentaUsuarioRepo = { manager: mockManager };

    mockCuentaStaffRepo = { findOne: jest.fn() };

    mockJwtService = { signAsync: jest.fn(), verifyAsync: jest.fn() };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_EXPIRES_IN') return '15m';
        if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
        if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
        return undefined;
      }),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'jwt-secret';
        throw new Error(`Missing config: ${key}`);
      }),
    };

    mockUsuariosService = { registrarPaciente: jest.fn() };

    mockAuditoriaService = { registrar: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(CuentaUsuario),
          useValue: mockCuentaUsuarioRepo,
        },
        {
          provide: getRepositoryToken(CuentaStaff),
          useValue: mockCuentaStaffRepo,
        },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UsuariosService, useValue: mockUsuariosService },
        { provide: AuditoriaService, useValue: mockAuditoriaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ---------------------------------------------------------------------------
  // registrar
  // ---------------------------------------------------------------------------
  describe('registrar', () => {
    const dto = {
      correoElectronico: 'Test@Example.COM ',
      nombre: 'Juan',
      apellido_pat: 'Pérez',
      apellido_mat: 'López',
      telefono: '5512345678',
      curp: 'CURP12345678901234',
      fechaNacimiento: '1990-01-01',
      genero: 'H',
      password: 'Password123',
    } as RegistroDto;

    it('should register a patient, log audit, and return tokens', async () => {
      mockUsuariosService.registrarPaciente.mockResolvedValue(undefined);
      mockQueryBuilder.getOne.mockResolvedValue(pacienteFixture);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token-abc')
        .mockResolvedValueOnce('refresh-token-xyz');

      const result = await service.registrar(dto, mockReq);

      expect(mockUsuariosService.registrarPaciente).toHaveBeenCalledWith(dto);

      expect(mockManager.createQueryBuilder).toHaveBeenCalledWith(
        Paciente,
        'p',
      );
      expect(mockQueryBuilder.innerJoinAndSelect).toHaveBeenCalledWith(
        'p.cuenta',
        'c',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(TRIM("p"."correoElectronico")) = :email',
        { email: 'test@example.com' },
      );
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();

      expect(mockAuditoriaService.registrar).toHaveBeenCalledWith({
        tipo: 'REGISTRO_USUARIO',
        descripcion: 'Registro de test@example.com',
        usuarioID: 1,
        req: mockReq,
      });

      expect(result).toEqual({
        mensaje: 'Registro exitoso',
        access_token: 'access-token-abc',
        refresh_token: 'refresh-token-xyz',
        usuario: {
          id: '10',
          pacienteId: 1,
          nombre: 'Juan',
          apellido: 'Pérez López',
          email: 'test@example.com',
          rol: 'PACIENTE',
        },
      });
    });

    it('should throw BadRequestException when paciente not found after registration', async () => {
      mockUsuariosService.registrarPaciente.mockResolvedValue(undefined);
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.registrar(dto, mockReq)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.registrar(dto, mockReq)).rejects.toThrow(
        'No se pudo completar el registro',
      );
    });

    it('should pass the request object to auditoriaService.registrar', async () => {
      mockUsuariosService.registrarPaciente.mockResolvedValue(undefined);
      mockQueryBuilder.getOne.mockResolvedValue(pacienteFixture);
      mockJwtService.signAsync
        .mockResolvedValueOnce('at')
        .mockResolvedValueOnce('rt');

      await service.registrar(dto, mockReq);

      expect(mockAuditoriaService.registrar).toHaveBeenCalledWith(
        expect.objectContaining({ req: mockReq }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // validarUsuario
  // ---------------------------------------------------------------------------
  describe('validarUsuario', () => {
    it('should login a patient by email and return tokens', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(pacienteFixture);
      mockBcryptCompare.mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-email')
        .mockResolvedValueOnce('refresh-email');

      const result = await service.validarUsuario(
        'test@example.com',
        'Password123',
        mockReq,
      );

      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(mockBcryptCompare).toHaveBeenCalledWith(
        'Password123',
        pacienteFixture.cuenta.password,
      );
      expect(mockAuditoriaService.registrar).toHaveBeenCalledWith({
        tipo: 'LOGIN_EXITOSO',
        descripcion: 'Paciente test@example.com',
        usuarioID: 1,
        req: mockReq,
      });
      expect(result.mensaje).toBe('Login exitoso');
      expect(result.usuario).toEqual(
        expect.objectContaining({ rol: 'PACIENTE', pacienteId: 1 }),
      );
    });

    it('should login a patient by CURP', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(pacientePorCURP);
      mockBcryptCompare.mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-curp')
        .mockResolvedValueOnce('refresh-curp');

      const result = await service.validarUsuario(
        'ABCD123456EFGH01',
        'Password123',
        mockReq,
      );

      expect(mockBcryptCompare).toHaveBeenCalled();
      expect(result.usuario).toEqual(
        expect.objectContaining({ rol: 'PACIENTE' }),
      );
    });

    it('should login a patient by phone', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(pacientePorTelefono);
      mockBcryptCompare.mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-phone')
        .mockResolvedValueOnce('refresh-phone');

      const result = await service.validarUsuario(
        '5512345678',
        'Password123',
        mockReq,
      );

      expect(mockBcryptCompare).toHaveBeenCalled();
      expect(result.usuario).toEqual(
        expect.objectContaining({ rol: 'PACIENTE' }),
      );
    });

    it('should login a staff member (RECEPCIONISTA)', async () => {
      mockCuentaStaffRepo.findOne.mockResolvedValue(staffFixture);
      mockBcryptCompare.mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-staff')
        .mockResolvedValueOnce('refresh-staff');

      const result = await service.validarUsuario(
        'staff@medly.com',
        'StaffPass123',
        mockReq,
      );

      expect(mockCuentaStaffRepo.findOne).toHaveBeenCalledWith({
        where: { correo: 'staff@medly.com' },
        relations: ['medico'],
      });
      expect(mockBcryptCompare).toHaveBeenCalledWith(
        'StaffPass123',
        staffFixture.password,
      );
      expect(mockAuditoriaService.registrar).toHaveBeenCalledWith({
        tipo: 'LOGIN_EXITOSO',
        descripcion: 'Staff staff@medly.com (RECEPCIONISTA)',
        usuarioID: 2,
        req: mockReq,
      });
      expect(result.mensaje).toBe('Login exitoso');
      expect(result.usuario).toEqual(
        expect.objectContaining({ rol: 'RECEPCIONISTA', staffId: 2 }),
      );
    });

    it('should throw UnauthorizedException on wrong password (staff found)', async () => {
      mockCuentaStaffRepo.findOne.mockResolvedValue(staffFixture);
      mockBcryptCompare.mockResolvedValue(false);

      await expect(
        service.validarUsuario('staff@medly.com', 'WrongPass1', mockReq),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockQueryBuilder.getOne).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on wrong password (patient found)', async () => {
      mockCuentaStaffRepo.findOne.mockResolvedValue(null);
      mockQueryBuilder.getOne.mockResolvedValue(pacienteFixture);
      mockBcryptCompare.mockResolvedValue(false);

      await expect(
        service.validarUsuario('test@example.com', 'WrongPass1', mockReq),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockAuditoriaService.registrar).toHaveBeenCalledWith({
        tipo: 'LOGIN_FALLIDO',
        descripcion: 'Intento fallido para "test@example.com"',
        req: mockReq,
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockCuentaStaffRepo.findOne.mockResolvedValue(null);

      await expect(
        service.validarUsuario('unknown@example.com', 'SomePass1', mockReq),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockAuditoriaService.registrar).toHaveBeenCalledWith({
        tipo: 'LOGIN_FALLIDO',
        descripcion: 'Intento fallido para "unknown@example.com"',
        req: mockReq,
      });
    });

    it('should not reveal whether email, CURP, phone or password was wrong', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockCuentaStaffRepo.findOne.mockResolvedValue(null);

      let error: Error | null = null;
      try {
        await service.validarUsuario('some@user.com', 'WrongPass1');
      } catch (e) {
        error = e as UnauthorizedException;
      }

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error!.message).toBe(
        'Correo, CURP o teléfono incorrectos, o contraseña incorrecta',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // refreshSession
  // ---------------------------------------------------------------------------
  describe('refreshSession', () => {
    it('should refresh a patient session', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        cuentaId: 10,
        typ: 'refresh',
        kind: 'paciente',
      });
      mockManager.findOne.mockResolvedValue(pacienteFixture);
      mockJwtService.signAsync
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');

      const result = await service.refreshSession('valid-refresh-token');

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-refresh-token',
        { secret: 'refresh-secret' },
      );
      expect(mockManager.findOne).toHaveBeenCalledWith(Paciente, {
        where: { pacienteID: 1 },
        relations: ['cuenta'],
      });
      expect(result.mensaje).toBe('Sesión renovada');
      expect(result.usuario).toEqual(
        expect.objectContaining({ rol: 'PACIENTE' }),
      );
    });

    it('should refresh a staff session', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 2,
        typ: 'refresh',
        kind: 'staff',
        rol: 'RECEPCIONISTA',
      });
      mockCuentaStaffRepo.findOne.mockResolvedValue(staffFixture);
      mockJwtService.signAsync
        .mockResolvedValueOnce('staff-new-access')
        .mockResolvedValueOnce('staff-new-refresh');

      const result = await service.refreshSession('staff-refresh-token');

      expect(mockCuentaStaffRepo.findOne).toHaveBeenCalledWith({
        where: { cuentaStaffID: 2 },
        relations: ['medico'],
      });
      expect(result.mensaje).toBe('Sesión renovada');
      expect(result.usuario).toEqual(
        expect.objectContaining({ rol: 'RECEPCIONISTA' }),
      );
    });

    it('should throw UnauthorizedException when token is expired or invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(
        new Error('Token expired'),
      );

      await expect(
        service.refreshSession('expired-token'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refreshSession('expired-token'),
      ).rejects.toThrow('Refresh token inválido o expirado');
    });

    it('should throw UnauthorizedException when typ is not "refresh"', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        typ: 'access',
        kind: 'paciente',
      });

      await expect(
        service.refreshSession('access-token'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refreshSession('access-token'),
      ).rejects.toThrow('Token no válido para renovación');
    });

    it('should throw UnauthorizedException when staff is not found', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 99,
        typ: 'refresh',
        kind: 'staff',
        rol: 'MEDICO',
      });
      mockCuentaStaffRepo.findOne.mockResolvedValue(null);

      await expect(
        service.refreshSession('staff-not-found'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refreshSession('staff-not-found'),
      ).rejects.toThrow('Sesión no válida');
    });

    it('should throw UnauthorizedException when paciente has no cuentaId in token', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        typ: 'refresh',
        kind: 'paciente',
      });

      await expect(
        service.refreshSession('no-cuentaid'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refreshSession('no-cuentaid'),
      ).rejects.toThrow('Sesión no válida');
    });
  });
});
