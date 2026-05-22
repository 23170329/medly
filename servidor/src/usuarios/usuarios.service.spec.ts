import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { UsuariosService } from './usuarios.service';
import { Paciente } from './entities/paciente.entity';
import { CuentaUsuario } from './entities/cuenta-usuario.entity';
import { RegistroDto } from './dto/registro.dto';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

const mockPacienteData = {
  pacienteID: 1,
  nombre: 'Juan',
  apellido_pat: 'Pérez',
  apellido_mat: 'López',
  correoElectronico: 'juan@example.com',
  telefono: '5512345678',
  fechaNacimiento: '1990-01-01',
  genero: 'H',
  curp: 'PELJ900101HDFRRN07',
};

describe('UsuariosService', () => {
  let service: UsuariosService;
  let mockPacienteRepo: Record<string, jest.Mock>;
  let mockCuentaRepo: Record<string, jest.Mock>;
  let mockQueryBuilder: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      getMany: jest.fn().mockResolvedValue([]),
    };

    mockPacienteRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      exist: jest.fn().mockResolvedValue(false),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockCuentaRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: getRepositoryToken(Paciente), useValue: mockPacienteRepo },
        {
          provide: getRepositoryToken(CuentaUsuario),
          useValue: mockCuentaRepo,
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registrarPaciente', () => {
    const validDto: RegistroDto = {
      nombre: 'Juan',
      apellido_pat: 'Pérez',
      apellido_mat: 'López',
      correoElectronico: 'juan@example.com',
      telefono: '5512345678',
      fechaNacimiento: '1990-01-01',
      genero: 'H',
      curp: 'PELJ900101HDFRRN07',
      password: 'Password123',
    };

    it('should create paciente and cuenta with bcrypt hash', async () => {
      const pacienteMock = { pacienteID: 1, ...validDto };
      const cuentaMock = {
        cuentaID: 1,
        password: 'hashed',
        paciente: pacienteMock,
        esInvitado: false,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockPacienteRepo.create.mockReturnValue(pacienteMock);
      mockPacienteRepo.save.mockResolvedValue(pacienteMock);
      mockCuentaRepo.create.mockReturnValue(cuentaMock);
      mockCuentaRepo.save.mockResolvedValue(cuentaMock);

      const result = await service.registrarPaciente(validDto);

      expect(result).toEqual(cuentaMock);
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
      expect(mockPacienteRepo.save).toHaveBeenCalledWith(pacienteMock);
      expect(mockCuentaRepo.save).toHaveBeenCalledWith(cuentaMock);
    });

    it('should persist normalized data through create calls', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      const pacienteMock = { pacienteID: 1, ...validDto };
      const cuentaMock = {
        cuentaID: 1,
        password: 'hashed',
        paciente: pacienteMock,
        esInvitado: false,
      };
      mockPacienteRepo.create.mockReturnValue(pacienteMock);
      mockPacienteRepo.save.mockResolvedValue(pacienteMock);
      mockCuentaRepo.create.mockReturnValue(cuentaMock);
      mockCuentaRepo.save.mockResolvedValue(cuentaMock);

      await service.registrarPaciente(validDto);

      expect(mockPacienteRepo.create).toHaveBeenCalledWith({
        nombre: validDto.nombre,
        apellido_pat: validDto.apellido_pat,
        apellido_mat: validDto.apellido_mat,
        correoElectronico: (validDto.correoElectronico ?? '').trim().toLowerCase(),
        telefono: validDto.telefono,
        fechaNacimiento: validDto.fechaNacimiento,
        genero: validDto.genero,
        curp: validDto.curp.trim().toUpperCase(),
      });
      expect(mockCuentaRepo.create).toHaveBeenCalledWith({
        password: 'hashed',
        paciente: pacienteMock,
        esInvitado: false,
      });
    });

    it('should reject @medly email domain', async () => {
      await expect(
        service.registrarPaciente({
          ...validDto,
          correoElectronico: 'test@medly.com',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject @medly.test domain', async () => {
      await expect(
        service.registrarPaciente({
          ...validDto,
          correoElectronico: 'test@medly.test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject @medly email case-insensitively', async () => {
      await expect(
        service.registrarPaciente({
          ...validDto,
          correoElectronico: 'TEST@MEDLY.COM',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate email', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);

      await expect(
        service.registrarPaciente(validDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject duplicate CURP', async () => {
      mockPacienteRepo.exist.mockResolvedValue(true);

      await expect(
        service.registrarPaciente(validDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should normalize email to lowercase before checks', async () => {
      mockPacienteRepo.save.mockResolvedValue({ pacienteID: 1 });
      mockCuentaRepo.save.mockResolvedValue({ cuentaID: 1 });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      await service.registrarPaciente({
        ...validDto,
        correoElectronico: '  Juan@Example.COM  ',
      });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(TRIM(p.correoElectronico)) = :correo',
        { correo: 'juan@example.com' },
      );
      expect(mockPacienteRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          correoElectronico: 'juan@example.com',
        }),
      );
    });

    it('should normalize CURP to uppercase', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockPacienteRepo.save.mockResolvedValue({ pacienteID: 1 });
      mockCuentaRepo.save.mockResolvedValue({ cuentaID: 1 });

      await service.registrarPaciente({
        ...validDto,
        curp: '  pelj900101hdfrrn07  ',
      });

      expect(mockPacienteRepo.exist).toHaveBeenCalledWith({
        where: { curp: 'PELJ900101HDFRRN07' },
      });
      expect(mockPacienteRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          curp: 'PELJ900101HDFRRN07',
        }),
      );
    });
  });

  describe('obtenerPerfil', () => {
    it('should return profile with joined apellido', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(mockPacienteData);

      const result = await service.obtenerPerfil(1);

      expect(result).toEqual({
        pacienteID: 1,
        nombre: 'Juan',
        apellido_pat: 'Pérez',
        apellido_mat: 'López',
        apellido: 'Pérez López',
        correoElectronico: 'juan@example.com',
        telefono: '5512345678',
        fechaNacimiento: '1990-01-01',
        genero: 'H',
        curp: 'PELJ900101HDFRRN07',
      });
    });

    it('should throw NotFoundException when paciente does not exist', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);

      await expect(service.obtenerPerfil(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle null apellido_mat gracefully', async () => {
      mockPacienteRepo.findOne.mockResolvedValue({
        ...mockPacienteData,
        apellido_mat: null,
      });

      const result = await service.obtenerPerfil(1);

      expect(result.apellido).toBe('Pérez');
      expect(result.apellido_mat).toBeNull();
    });

    it('should handle undefined apellido_mat gracefully', async () => {
      const { apellido_mat, ...sinMat } = mockPacienteData;
      mockPacienteRepo.findOne.mockResolvedValue(sinMat);

      const result = await service.obtenerPerfil(1);

      expect(result.apellido).toBe('Pérez');
      expect(result.apellido_mat).toBeUndefined();
    });
  });

  describe('actualizarPerfil', () => {
    it('should update profile fields successfully', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(mockPacienteData);
      mockPacienteRepo.save.mockResolvedValue({
        ...mockPacienteData,
        nombre: 'Juan Carlos',
      });

      const perfilEsperado = {
        ...mockPacienteData,
        nombre: 'Juan Carlos',
        apellido: 'Pérez López',
      };
      const obtenerPerfilSpy = jest
        .spyOn(service, 'obtenerPerfil')
        .mockResolvedValue(perfilEsperado);

      const result = await service.actualizarPerfil(1, {
        nombre: 'Juan Carlos',
      });

      expect(result).toEqual(perfilEsperado);
      expect(mockPacienteRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Juan Carlos' }),
      );
      expect(obtenerPerfilSpy).toHaveBeenCalledWith(1);
    });

    it('should throw ConflictException when new email is already in use', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(mockPacienteData);
      mockPacienteRepo.exist.mockResolvedValue(true);

      await expect(
        service.actualizarPerfil(1, {
          correoElectronico: 'otro@example.com',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when paciente does not exist', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(null);

      await expect(
        service.actualizarPerfil(999, { nombre: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not check duplicate email if email is unchanged', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(mockPacienteData);
      mockPacienteRepo.save.mockResolvedValue(mockPacienteData);
      jest.spyOn(service, 'obtenerPerfil').mockResolvedValue({
        ...mockPacienteData,
        apellido: 'Pérez López',
      });

      await service.actualizarPerfil(1, {
        correoElectronico: 'juan@example.com',
      });

      expect(mockPacienteRepo.exist).not.toHaveBeenCalled();
    });

    it('should not check duplicate email when correoElectronico is not provided', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(mockPacienteData);
      mockPacienteRepo.save.mockResolvedValue(mockPacienteData);
      jest.spyOn(service, 'obtenerPerfil').mockResolvedValue({
        ...mockPacienteData,
        apellido: 'Pérez López',
      });

      await service.actualizarPerfil(1, { telefono: '5599999999' });

      expect(mockPacienteRepo.exist).not.toHaveBeenCalled();
    });

    it('should call obtenerPerfil after successful update', async () => {
      mockPacienteRepo.findOne.mockResolvedValue(mockPacienteData);
      mockPacienteRepo.save.mockResolvedValue(mockPacienteData);
      const obtenerPerfilSpy = jest
        .spyOn(service, 'obtenerPerfil')
        .mockResolvedValue({
          ...mockPacienteData,
          apellido: 'Pérez López',
        });

      await service.actualizarPerfil(1, { nombre: 'Juan' });

      expect(obtenerPerfilSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('buscarPacientes', () => {
    it('should return empty array for query shorter than 2 characters', async () => {
      const result = await service.buscarPacientes('a');

      expect(result).toEqual([]);
      expect(mockPacienteRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return empty array for empty string', async () => {
      const result = await service.buscarPacientes('');

      expect(result).toEqual([]);
      expect(mockPacienteRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return results matching by name', async () => {
      const resultados = [mockPacienteData];
      mockQueryBuilder.getMany.mockResolvedValue(resultados);

      const result = await service.buscarPacientes('Juan');

      expect(result).toEqual(resultados);
      expect(mockPacienteRepo.createQueryBuilder).toHaveBeenCalledWith('p');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(p.nombre) LIKE LOWER(:like)',
        { like: '%Juan%' },
      );
    });

    it('should search across nombre, apellidos, and correoElectronico', async () => {
      const resultados = [mockPacienteData];
      mockQueryBuilder.getMany.mockResolvedValue(resultados);

      await service.buscarPacientes('Pérez');

      expect(mockQueryBuilder.where).toHaveBeenCalledTimes(1);
      expect(mockQueryBuilder.orWhere).toHaveBeenCalledTimes(4);
      expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith(
        'LOWER(p.apellido_pat) LIKE LOWER(:like)',
        { like: '%Pérez%' },
      );
      expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith(
        'LOWER(p.apellido_mat) LIKE LOWER(:like)',
        { like: '%Pérez%' },
      );
      expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith(
        'LOWER(p.correoElectronico) LIKE LOWER(:like)',
        { like: '%Pérez%' },
      );
    });

    it('should limit results to 25', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.buscarPacientes('test');

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(25);
    });

    it('should order by pacienteID descending', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.buscarPacientes('test');

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'p.pacienteID',
        'DESC',
      );
    });

    it('should search CURP by uppercase prefix', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.buscarPacientes('pelj');

      expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith(
        'UPPER(p.curp) LIKE UPPER(:pref)',
        { pref: 'PELJ%' },
      );
    });
  });
});
