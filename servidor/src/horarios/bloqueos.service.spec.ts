import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BloqueosService } from './bloqueos.service';
import { HorariosService } from './horarios.service';
import { BloqueoAgenda } from './entities/bloqueo-agenda.entity';
import { SlotAgenda } from './entities/slot-agenda.entity';
import { EstadoSlot } from '../common/enums';

const createMockQueryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  getCount: jest.fn(),
  execute: jest.fn().mockResolvedValue({ affected: 1 }),
});

describe('BloqueosService', () => {
  let service: BloqueosService;
  let mockRepo: any;
  let mockSlotRepo: any;
  let mockHorariosService: any;
  let mockBloqueoQB: ReturnType<typeof createMockQueryBuilder>;
  let mockSlotQB: ReturnType<typeof createMockQueryBuilder>;

  beforeEach(async () => {
    mockBloqueoQB = createMockQueryBuilder();
    mockSlotQB = createMockQueryBuilder();

    mockRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(() => mockBloqueoQB),
      create: jest.fn((x: any) => x),
      save: jest.fn((x: any) => Promise.resolve(x)),
    };

    mockSlotRepo = {
      createQueryBuilder: jest.fn(() => mockSlotQB),
    };

    mockHorariosService = {
      regenerarSlotsMedico: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BloqueosService,
        { provide: getRepositoryToken(BloqueoAgenda), useValue: mockRepo },
        { provide: getRepositoryToken(SlotAgenda), useValue: mockSlotRepo },
        { provide: HorariosService, useValue: mockHorariosService },
      ],
    }).compile();

    service = module.get<BloqueosService>(BloqueosService);
  });

  // -----------------------------------------------------------------------
  // listar
  // -----------------------------------------------------------------------
  describe('listar', () => {
    it('1. retorna todos los bloqueos de un médico ordenados por inicio DESC', async () => {
      const bloqueos = [
        { bloqueoID: 2, inicio: new Date('2026-02-10') },
        { bloqueoID: 1, inicio: new Date('2026-02-05') },
      ];
      mockRepo.find.mockResolvedValue(bloqueos);

      const result = await service.listar(1);

      expect(result).toEqual(bloqueos);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { medico: { medicoID: 1 } },
        relations: ['medico'],
        order: { inicio: 'DESC' },
      });
    });
  });

  // -----------------------------------------------------------------------
  // crear
  // -----------------------------------------------------------------------
  describe('crear', () => {
    const valDto = { inicio: '2026-02-10T08:00:00Z', fin: '2026-02-10T18:00:00Z', motivo: 'Mantenimiento' };

    it('2. crea bloqueo exitosamente y elimina slots LIBRE en el rango', async () => {
      mockBloqueoQB.getCount.mockResolvedValue(0);
      mockSlotQB.execute.mockResolvedValue({ affected: 5 });
      const saved = { bloqueoID: 1, inicio: new Date('2026-02-10T08:00:00Z'), fin: new Date('2026-02-10T18:00:00Z'), motivo: 'Mantenimiento' };
      mockRepo.save.mockResolvedValue(saved);

      const result = await service.crear(1, valDto);

      expect(result).toEqual(saved);
      expect(mockRepo.create).toHaveBeenCalledWith({
        medico: { medicoID: 1 },
        inicio: new Date(valDto.inicio),
        fin: new Date(valDto.fin),
        motivo: 'Mantenimiento',
      });
      expect(mockSlotQB.execute).toHaveBeenCalled();
      // Verify the slot deletion targets LIBRE slots in the same range
      expect(mockSlotQB.where).toHaveBeenCalledWith('"medicoID" = :mid', { mid: 1 });
      expect(mockSlotQB.andWhere).toHaveBeenCalledWith('estado = :est', { est: EstadoSlot.LIBRE });
    });

    it('3. lanza BadRequestException si fin <= inicio', async () => {
      await expect(
        service.crear(1, { inicio: '2026-02-10T18:00:00Z', fin: '2026-02-10T08:00:00Z' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('4. lanza BadRequestException si se traslapa con otro bloqueo existente', async () => {
      mockBloqueoQB.getCount.mockResolvedValue(1);

      await expect(service.crear(1, valDto)).rejects.toThrow(BadRequestException);
    });

    it('5. recorta el motivo con trim y lo asigna como null si queda vacío', async () => {
      mockBloqueoQB.getCount.mockResolvedValue(0);
      mockSlotQB.execute.mockResolvedValue({ affected: 0 });
      mockRepo.save.mockResolvedValue({ bloqueoID: 2 } as any);

      await service.crear(1, { inicio: '2026-02-10T08:00:00Z', fin: '2026-02-10T18:00:00Z', motivo: '   ' });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ motivo: null }),
      );
    });

    it('asigna null si motivo no se provee', async () => {
      mockBloqueoQB.getCount.mockResolvedValue(0);
      mockSlotQB.execute.mockResolvedValue({ affected: 0 });
      mockRepo.save.mockResolvedValue({ bloqueoID: 3 } as any);

      await service.crear(1, { inicio: '2026-02-10T08:00:00Z', fin: '2026-02-10T18:00:00Z' });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ motivo: null }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // eliminar
  // -----------------------------------------------------------------------
  describe('eliminar', () => {
    it('6. elimina bloqueo y regenera slots del médico', async () => {
      mockBloqueoQB.execute.mockResolvedValue({ affected: 1 });

      await service.eliminar(1, 5);

      expect(mockBloqueoQB.where).toHaveBeenCalledWith('bloqueoID = :id', { id: 5 });
      expect(mockBloqueoQB.andWhere).toHaveBeenCalledWith('"medicoID" = :mid', { mid: 1 });
      expect(mockBloqueoQB.execute).toHaveBeenCalled();
      expect(mockHorariosService.regenerarSlotsMedico).toHaveBeenCalledWith(1);
    });

    it('7. lanza NotFoundException si el bloqueo no existe', async () => {
      mockBloqueoQB.execute.mockResolvedValue({ affected: 0 });

      await expect(service.eliminar(1, 999)).rejects.toThrow(NotFoundException);
      expect(mockHorariosService.regenerarSlotsMedico).not.toHaveBeenCalled();
    });
  });
});
