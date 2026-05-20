import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegistroDto } from '../usuarios/dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: {
    registrar: jest.Mock;
    validarUsuario: jest.Mock;
    refreshSession: jest.Mock;
  };

  const mockReq = { ip: '127.0.0.1', headers: {} } as Request;

  beforeEach(async () => {
    mockAuthService = {
      registrar: jest.fn(),
      validarUsuario: jest.fn(),
      refreshSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('registro', () => {
    it('should call authService.registrar with the body and request', async () => {
      const body = {
        correoElectronico: 'test@example.com',
        nombre: 'Juan',
        apellido_pat: 'Pérez',
        apellido_mat: 'López',
        telefono: '5512345678',
        curp: 'CURP12345678901234',
        fechaNacimiento: '1990-01-01',
        genero: 'M',
        password: 'Password123',
      } as RegistroDto;

      mockAuthService.registrar.mockResolvedValue({ mensaje: 'ok' });

      const result = await controller.registro(body, mockReq);

      expect(mockAuthService.registrar).toHaveBeenCalledWith(body, mockReq);
      expect(result).toEqual({ mensaje: 'ok' });
    });
  });

  describe('login', () => {
    it('should call authService.validarUsuario with correo, contrasena, and request', async () => {
      const body = {
        correo: 'test@example.com',
        contrasena: 'Password123',
      } as LoginDto;

      mockAuthService.validarUsuario.mockResolvedValue({
        mensaje: 'Login exitoso',
      });

      const result = await controller.login(body, mockReq);

      expect(mockAuthService.validarUsuario).toHaveBeenCalledWith(
        'test@example.com',
        'Password123',
        mockReq,
      );
      expect(result).toEqual({ mensaje: 'Login exitoso' });
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshSession with refresh_token', async () => {
      const body = {
        refresh_token: 'some-long-valid-refresh-token',
      } as RefreshDto;

      mockAuthService.refreshSession.mockResolvedValue({
        mensaje: 'Sesión renovada',
      });

      const result = await controller.refresh(body);

      expect(mockAuthService.refreshSession).toHaveBeenCalledWith(
        'some-long-valid-refresh-token',
      );
      expect(result).toEqual({ mensaje: 'Sesión renovada' });
    });
  });
});
