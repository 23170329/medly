import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConsultasService } from './consultas.service';
import { ConsultaClinica } from './entities/consulta-clinica.entity';
import { Cita } from '../citas/entities/cita.entity';
import { Paciente } from '../usuarios/entities/paciente.entity';
import { Medico } from '../medicos/entities/medico.entity';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { CrearConsultaDto } from './dto/crear-consulta.dto';
import { ActualizarConsultaDto } from './dto/actualizar-consulta.dto';

describe('ConsultasService', () => {
  let service: ConsultasService;
  let repo: jest.Mocked<Repository<ConsultaClinica>>;
  let citaRepo: jest.Mocked<Repository<Cita>>;
  let pacienteRepo: jest.Mocked<Repository<Paciente>>;
  let medicoRepo: jest.Mocked<Repository<Medico>>;
  let notificacionesService: jest.Mocked<NotificacionesService>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const mockNotificacionesService = {
      crear: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultasService,
        {
          provide: getRepositoryToken(ConsultaClinica),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Cita),
          useValue: {
            findOne: jest.fn(),
            exist: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Paciente),
          useValue: {
            findOne: jest.fn(),
            findOneOrFail: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Medico),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: NotificacionesService,
          useValue: mockNotificacionesService,
        },
      ],
    }).compile();

    service = module.get<ConsultasService>(ConsultasService);
    repo = module.get(getRepositoryToken(ConsultaClinica));
    citaRepo = module.get(getRepositoryToken(Cita));
    pacienteRepo = module.get(getRepositoryToken(Paciente));
    medicoRepo = module.get(getRepositoryToken(Medico));
    notificacionesService = module.get(NotificacionesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listarPorMedico', () => {
    const medicoId = 1;
    const consultas: ConsultaClinica[] = [
      { consultaID: 1 } as ConsultaClinica,
      { consultaID: 2 } as ConsultaClinica,
    ];

    it('returns all consultas for a doctor', async () => {
      mockQueryBuilder.getMany.mockResolvedValue(consultas);

      const result = await service.listarPorMedico(medicoId);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'c.medicoID = :mid',
        { mid: medicoId },
      );
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual(consultas);
    });

    it('filters by pacienteId when provided', async () => {
      const pacienteId = 5;
      mockQueryBuilder.getMany.mockResolvedValue([consultas[0]]);

      const result = await service.listarPorMedico(medicoId, pacienteId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'c.pacienteID = :pid',
        { pid: pacienteId },
      );
      expect(result).toHaveLength(1);
    });

    it('ignores NaN pacienteId', async () => {
      mockQueryBuilder.getMany.mockResolvedValue(consultas);

      const result = await service.listarPorMedico(medicoId, NaN);

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
      expect(result).toEqual(consultas);
    });
  });

  describe('obtener', () => {
    const medicoId = 1;
    const consultaId = 10;
    const consulta = { consultaID: consultaId } as ConsultaClinica;

    it('returns consulta if owned by doctor', async () => {
      repo.findOne.mockResolvedValue(consulta);

      const result = await service.obtener(medicoId, consultaId);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { consultaID: consultaId, medico: { medicoID: medicoId } },
        relations: ['paciente', 'cita'],
      });
      expect(result).toBe(consulta);
    });

    it('throws NotFoundException if not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.obtener(medicoId, consultaId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('crear', () => {
    const medicoId = 1;
    const baseDto: CrearConsultaDto = {
      pacienteID: 100,
      pesoKg: 70,
      alturaM: 1.75,
      identificacion: 'ID-001',
      antecedentes: 'Antecedentes...',
      interrogatorio: 'Interrogatorio...',
      exploracionFisica: 'Exploración...',
      diagnosticos: 'Diagnósticos...',
      tratamiento: 'Tratamiento...',
      evolucion: 'Evolución...',
      pronostico: 'Pronóstico...',
      notasConfidenciales: 'Notas...',
    };

    it('creates consulta with all clinical fields', async () => {
      const created = { ...baseDto } as unknown as ConsultaClinica;
      pacienteRepo.findOne.mockResolvedValue({
        pacienteID: 100,
      } as Paciente);
      pacienteRepo.save.mockResolvedValue({} as Paciente);
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.crear(medicoId, baseDto);

      expect(pacienteRepo.save).toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          paciente: { pacienteID: baseDto.pacienteID },
          medico: { medicoID: medicoId },
          cita: null,
          pesoKg: 70,
          alturaM: 1.75,
          identificacion: baseDto.identificacion,
        }),
      );
      expect(result).toBe(created);
    });

    it('when citaID provided, validates cita matches both doctor and patient', async () => {
      const dto = { ...baseDto, citaID: 50 };
      citaRepo.findOne.mockResolvedValue({ citaID: 50 } as Cita);
      pacienteRepo.findOne.mockResolvedValue({ pacienteID: 100 } as Paciente);
      pacienteRepo.save.mockResolvedValue({} as Paciente);
      const created = { ...dto } as unknown as ConsultaClinica;
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      await service.crear(medicoId, dto);

      expect(citaRepo.findOne).toHaveBeenCalledWith({
        where: {
          citaID: 50,
          medicoID: medicoId,
          pacienteID: dto.pacienteID,
        },
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cita: { citaID: 50 },
        }),
      );
    });

    it('throws ForbiddenException if cita does not match doctor or patient', async () => {
      const dto = { ...baseDto, citaID: 50 };
      citaRepo.findOne.mockResolvedValue(null);

      await expect(service.crear(medicoId, dto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('throws when peso and altura are missing', async () => {
      const dto: CrearConsultaDto = { pacienteID: 100 };
      await expect(service.crear(medicoId, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('works without citaID', async () => {
      const dto: CrearConsultaDto = {
        pacienteID: 100,
        pesoKg: 68,
        alturaM: 1.7,
        diagnosticos: 'Dx',
      };
      pacienteRepo.findOne.mockResolvedValue({ pacienteID: 100 } as Paciente);
      pacienteRepo.save.mockResolvedValue({} as Paciente);
      const created = { ...dto } as unknown as ConsultaClinica;
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.crear(medicoId, dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cita: null,
          diagnosticos: 'Dx',
        }),
      );
      expect(citaRepo.findOne).not.toHaveBeenCalled();
      expect(result).toBe(created);
    });
  });

  describe('actualizar', () => {
    const medicoId = 1;
    const consultaId = 10;
    const existing = {
      consultaID: consultaId,
      diagnosticos: 'Viejo Dx',
      tratamiento: 'Viejo Tx',
    } as ConsultaClinica;

    it('updates consulta fields', async () => {
      repo.findOne.mockResolvedValue(existing);
      const dto: ActualizarConsultaDto = { diagnosticos: 'Nuevo Dx' };
      const saved = { ...existing, ...dto };
      repo.save.mockResolvedValue(saved);

      const result = await service.actualizar(medicoId, consultaId, dto);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { consultaID: consultaId, medico: { medicoID: medicoId } },
        relations: ['paciente', 'cita'],
      });
      expect(repo.save).toHaveBeenCalled();
      expect(result.diagnosticos).toBe('Nuevo Dx');
      expect(result.tratamiento).toBe('Viejo Tx');
    });

    it('throws NotFoundException if consulta not found for this doctor', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.actualizar(medicoId, consultaId, {
          diagnosticos: 'Dx',
        } as ActualizarConsultaDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
