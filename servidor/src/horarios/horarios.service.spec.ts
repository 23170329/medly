import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HorariosService } from './horarios.service';
import { SlotAgenda } from './entities/slot-agenda.entity';
import { Horario } from './entities/horario.entity';
import { BloqueoAgenda } from './entities/bloqueo-agenda.entity';
import { EstadoSlot } from '../common/enums';
import { Medico } from '../medicos/entities/medico.entity';
import { Consultorio } from '../sucursales/entities/consultorio.entity';
import { CrearHorarioDto } from './dto/crear-horario.dto';
import { ActualizarHorarioDto } from './dto/actualizar-horario.dto';

const createMockQueryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
  getCount: jest.fn(),
  execute: jest.fn().mockResolvedValue({ affected: 5 }),
});

describe('HorariosService', () => {
  let service: HorariosService;
  let mockSlotRepo: any;
  let mockHorarioRepo: any;
  let mockBloqueoRepo: any;
  let mockQB: ReturnType<typeof createMockQueryBuilder>;

  beforeEach(async () => {
    mockQB = createMockQueryBuilder();
    mockSlotRepo = {
      createQueryBuilder: jest.fn(() => mockQB),
      manager: { findOne: jest.fn() },
      create: jest.fn((x: any) => x),
      save: jest.fn((x: any) => Promise.resolve(x)),
    };
    mockHorarioRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((x: any) => x),
      save: jest.fn((x: any) => Promise.resolve(x)),
      remove: jest.fn(),
    };
    mockBloqueoRepo = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HorariosService,
        { provide: getRepositoryToken(SlotAgenda), useValue: mockSlotRepo },
        { provide: getRepositoryToken(Horario), useValue: mockHorarioRepo },
        { provide: getRepositoryToken(BloqueoAgenda), useValue: mockBloqueoRepo },
      ],
    }).compile();

    service = module.get<HorariosService>(HorariosService);
  });

  // -----------------------------------------------------------------------
  // disponiblesRangoQuery
  // -----------------------------------------------------------------------
  describe('disponiblesRangoQuery', () => {
    it('1. retorna slots LIBRE para médico+sucursal dentro del rango de fechas', async () => {
      const slotsMock = [
        { slotID: 1, medicoID: 1, sucursalID: 2, inicio: new Date(), fin: new Date(), estado: EstadoSlot.LIBRE },
      ];
      mockQB.getMany.mockResolvedValue(slotsMock);

      const result = await service.disponiblesRangoQuery({
        medicoId: 1,
        sucursalId: 2,
        desde: new Date('2026-01-01'),
        hasta: new Date('2026-01-31'),
      });

      expect(result).toEqual(slotsMock);
      expect(mockSlotRepo.createQueryBuilder).toHaveBeenCalledWith('s');
      expect(mockQB.where).toHaveBeenCalledWith('s.medicoID = :mid', { mid: 1 });
      expect(mockQB.andWhere).toHaveBeenCalledWith('s.sucursalID = :sid', { sid: 2 });
      expect(mockQB.andWhere).toHaveBeenCalledWith('s.estado = :estado', { estado: EstadoSlot.LIBRE });
      expect(mockQB.orderBy).toHaveBeenCalledWith('s.inicio', 'ASC');
    });

    it('2. incluye cláusula NOT EXISTS que excluye slots con bloqueos superpuestos', async () => {
      mockQB.getMany.mockResolvedValue([]);

      await service.disponiblesRangoQuery({ medicoId: 1, sucursalId: 2 });

      expect(mockQB.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('NOT EXISTS'),
      );
    });

    it('3. usa rango por defecto: desde=ahora hasta=ahora+30d si no se proveen fechas', async () => {
      const now = new Date('2026-03-01T12:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);
      mockQB.getMany.mockResolvedValue([]);

      await service.disponiblesRangoQuery({ medicoId: 1, sucursalId: 2 });

      const expectedHasta = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      expect(mockQB.andWhere).toHaveBeenCalledWith('s.inicio >= :desde', { desde: now });
      expect(mockQB.andWhere).toHaveBeenCalledWith('s.inicio <= :hasta', { hasta: expectedHasta });

      jest.useRealTimers();
    });
  });

  // -----------------------------------------------------------------------
  // crearHorario
  // -----------------------------------------------------------------------
  describe('crearHorario', () => {
    const valDto: CrearHorarioDto = {
      medicoID: 1,
      consultorioID: 5,
      diaSemana: 'Lunes',
      horaInicio: '09:00:00',
      horaFin: '17:00:00',
    };

    it('4. crea horario, valida entidades relacionadas y regenera slots', async () => {
      const mockMedico = { medicoID: 1, nombre: 'Dr. Test' };
      const mockConsultorio = { consultorioID: 5, sucursal: { sucursalID: 10 } };
      (mockSlotRepo.manager.findOne as jest.Mock)
        .mockResolvedValueOnce(mockMedico)
        .mockResolvedValueOnce(mockConsultorio);

      const createdHorario = { horarioID: 1, ...valDto };
      mockHorarioRepo.create.mockReturnValue(createdHorario);
      mockHorarioRepo.save.mockResolvedValue(createdHorario);

      const regenerarSpy = jest.spyOn(service, 'regenerarSlotsMedico' as any).mockResolvedValue(10);

      const result = await service.crearHorario(valDto);

      expect(result.horarioID).toBe(1);
      expect(mockHorarioRepo.create).toHaveBeenCalledWith({
        medico: { medicoID: 1 },
        consultorio: { consultorioID: 5 },
        diaSemana: 'Lunes',
        horaInicio: '09:00:00',
        horaFin: '17:00:00',
      });
      expect(mockHorarioRepo.save).toHaveBeenCalled();
      expect(regenerarSpy).toHaveBeenCalledWith(1);
      regenerarSpy.mockRestore();
    });

    it('5. lanza BadRequestException si el médico no existe', async () => {
      (mockSlotRepo.manager.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.crearHorario(valDto)).rejects.toThrow(BadRequestException);
    });

    it('6. lanza BadRequestException si el consultorio no existe', async () => {
      (mockSlotRepo.manager.findOne as jest.Mock)
        .mockResolvedValueOnce({ medicoID: 1 })
        .mockResolvedValueOnce(null);

      await expect(service.crearHorario(valDto)).rejects.toThrow(BadRequestException);
    });

    it('7. lanza BadRequestException si el nombre del día es inválido', async () => {
      (mockSlotRepo.manager.findOne as jest.Mock)
        .mockResolvedValueOnce({ medicoID: 1 })
        .mockResolvedValueOnce({ consultorioID: 5, sucursal: { sucursalID: 10 } });

      await expect(
        service.crearHorario({ ...valDto, diaSemana: 'invalidDay' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('8. lanza BadRequestException si horaInicio >= horaFin', async () => {
      await expect(
        service.crearHorario({ ...valDto, horaInicio: '17:00:00', horaFin: '09:00:00' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('9. normaliza acentos: "miércoles" se mapea a miercoles (índice 3) y no lanza error', async () => {
      (mockSlotRepo.manager.findOne as jest.Mock)
        .mockResolvedValueOnce({ medicoID: 1 })
        .mockResolvedValueOnce({ consultorioID: 5, sucursal: { sucursalID: 10 } });

      const saved = { horarioID: 2, ...valDto, diaSemana: 'miércoles' };
      mockHorarioRepo.save.mockResolvedValue(saved);
      const regenerarSpy = jest.spyOn(service, 'regenerarSlotsMedico' as any).mockResolvedValue(5);

      const result = await service.crearHorario({ ...valDto, diaSemana: 'miércoles' });

      expect(result.horarioID).toBe(2);
      expect(regenerarSpy).toHaveBeenCalledWith(1);
      regenerarSpy.mockRestore();
    });

    it('lanza BadRequestException con mensaje descriptivo para día inválido', async () => {
      (mockSlotRepo.manager.findOne as jest.Mock)
        .mockResolvedValueOnce({ medicoID: 1 })
        .mockResolvedValueOnce({ consultorioID: 5, sucursal: { sucursalID: 10 } });

      let thrown: any;
      try {
        await service.crearHorario({ ...valDto, diaSemana: 'xyz' });
      } catch (e) {
        thrown = e;
      }
      expect(thrown).toBeInstanceOf(BadRequestException);
      expect(thrown.message).toContain('xyz');
      expect(thrown.message).toContain('Lunes');
    });
  });

  // -----------------------------------------------------------------------
  // obtenerHorariosPorMedico / obtenerHorario / actualizarHorario / eliminarHorario
  // -----------------------------------------------------------------------
  describe('operaciones CRUD sobre horarios', () => {
    describe('obtenerHorariosPorMedico', () => {
      it('retorna horarios con relaciones consultorio y sucursal', async () => {
        const horarios = [
          { horarioID: 1, consultorio: { consultorioID: 5, sucursal: { sucursalID: 10 } } },
        ];
        mockHorarioRepo.find.mockResolvedValue(horarios);

        const result = await service.obtenerHorariosPorMedico(1);

        expect(result).toEqual(horarios);
        expect(mockHorarioRepo.find).toHaveBeenCalledWith({
          where: { medico: { medicoID: 1 } },
          relations: ['consultorio', 'consultorio.sucursal'],
        });
      });
    });

    describe('obtenerHorario', () => {
      it('10a. retorna horario con relaciones medico, consultorio y sucursal', async () => {
        const horario = { horarioID: 1, medico: { medicoID: 1 }, consultorio: { consultorioID: 5, sucursal: {} } };
        mockHorarioRepo.findOne.mockResolvedValue(horario);

        const result = await service.obtenerHorario(1);

        expect(result).toEqual(horario);
        expect(mockHorarioRepo.findOne).toHaveBeenCalledWith({
          where: { horarioID: 1 },
          relations: ['medico', 'consultorio', 'consultorio.sucursal'],
        });
      });

      it('10b. lanza NotFoundException si no existe', async () => {
        mockHorarioRepo.findOne.mockResolvedValue(null);

        await expect(service.obtenerHorario(999)).rejects.toThrow(NotFoundException);
      });
    });

    describe('actualizarHorario', () => {
      const existingHorario = {
        horarioID: 1,
        medico: { medicoID: 1 },
        consultorio: { consultorioID: 5 },
        diaSemana: 'Lunes',
        horaInicio: '09:00:00',
        horaFin: '17:00:00',
      };

      it('11. actualiza campos y regenera slots', async () => {
        mockHorarioRepo.findOne.mockResolvedValue(existingHorario);
        const updated = { ...existingHorario, diaSemana: 'Martes', horaInicio: '10:00:00' };
        mockHorarioRepo.save.mockResolvedValue(updated);
        const regenerarSpy = jest.spyOn(service, 'regenerarSlotsMedico' as any).mockResolvedValue(5);

        const result = await service.actualizarHorario(1, {
          diaSemana: 'Martes',
          horaInicio: '10:00:00',
        } as ActualizarHorarioDto);

        expect(result.diaSemana).toBe('Martes');
        expect(result.horaInicio).toBe('10:00:00');
        expect(regenerarSpy).toHaveBeenCalledWith(1);
        regenerarSpy.mockRestore();
      });

      it('12. lanza BadRequestException si día inválido', async () => {
        mockHorarioRepo.findOne.mockResolvedValue(existingHorario);

        await expect(
          service.actualizarHorario(1, { diaSemana: 'invalid' } as ActualizarHorarioDto),
        ).rejects.toThrow(BadRequestException);
      });

      it('13. lanza BadRequestException si horaInicio >= horaFin', async () => {
        mockHorarioRepo.findOne.mockResolvedValue(existingHorario);

        await expect(
          service.actualizarHorario(1, { horaInicio: '18:00:00', horaFin: '08:00:00' } as ActualizarHorarioDto),
        ).rejects.toThrow(BadRequestException);
      });

      it('lanza BadRequestException si no se provee horaInicio/horaFin y la existente tiene inicio>=fin (caso borde)', async () => {
        mockHorarioRepo.findOne.mockResolvedValue({
          ...existingHorario,
          horaInicio: '17:00:00',
          horaFin: '09:00:00',
        });

        await expect(
          service.actualizarHorario(1, { diaSemana: 'Martes' } as ActualizarHorarioDto),
        ).rejects.toThrow(BadRequestException);
      });

      it('lanza NotFoundException si el horario no existe', async () => {
        mockHorarioRepo.findOne.mockResolvedValue(null);

        await expect(
          service.actualizarHorario(999, {} as ActualizarHorarioDto),
        ).rejects.toThrow(NotFoundException);
      });

      it('valida consultorioID si se provee', async () => {
        mockHorarioRepo.findOne.mockResolvedValue(existingHorario);
        (mockSlotRepo.manager.findOne as jest.Mock).mockResolvedValueOnce(null);

        await expect(
          service.actualizarHorario(1, { consultorioID: 999 } as ActualizarHorarioDto),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('eliminarHorario', () => {
      it('14a. elimina horario y regenera slots', async () => {
        const horario = { horarioID: 1, medico: { medicoID: 3 } };
        mockHorarioRepo.findOne.mockResolvedValue(horario);
        const regenerarSpy = jest.spyOn(service, 'regenerarSlotsMedico' as any).mockResolvedValue(0);

        await service.eliminarHorario(1);

        expect(mockHorarioRepo.remove).toHaveBeenCalledWith(horario);
        expect(regenerarSpy).toHaveBeenCalledWith(3);
        regenerarSpy.mockRestore();
      });

      it('14b. lanza NotFoundException si no existe', async () => {
        mockHorarioRepo.findOne.mockResolvedValue(null);

        await expect(service.eliminarHorario(999)).rejects.toThrow(NotFoundException);
      });
    });
  });

  // -----------------------------------------------------------------------
  // regenerarSlotsMedico
  // -----------------------------------------------------------------------
  describe('regenerarSlotsMedico', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-02-08T00:00:00')); // Sunday local
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const horarioLunes = {
      horarioID: 1,
      diaSemana: 'Lunes',
      horaInicio: '09:00:00',
      horaFin: '17:00:00',
      medico: { medicoID: 1 },
      consultorio: { consultorioID: 5, sucursal: { sucursalID: 10 } },
    };

    it('15. crea slots de 30 minutos dentro del rango del horario por 90 días', async () => {
      mockHorarioRepo.find.mockResolvedValue([horarioLunes]);
      mockBloqueoRepo.find.mockResolvedValue([]);
      mockSlotRepo.create.mockImplementation((x: any) => x);

      const result = await service.regenerarSlotsMedico(1);

      expect(result).toBeGreaterThan(0);
      // All created slots must have estado LIBRE
      const allCalls = (mockSlotRepo.create as jest.Mock).mock.calls;
      for (const [arg] of allCalls) {
        expect(arg.estado).toBe(EstadoSlot.LIBRE);
        expect(arg.medicoID).toBe(1);
        expect(arg.sucursalID).toBe(10);
      }
      // Each slot must be exactly 30 min
      for (const [arg] of allCalls) {
        const dur = (arg.fin.getTime() - arg.inicio.getTime()) / 60000;
        expect(dur).toBe(30);
      }
    });

    it('16. omite slots que se traslapan con bloqueos', async () => {
      const feb9 = new Date('2026-02-09T00:00:00'); // Monday
      const bloqueo = {
        inicio: new Date('2026-02-09T10:00:00'),
        fin: new Date('2026-02-09T11:00:00'),
      };
      mockHorarioRepo.find.mockResolvedValue([horarioLunes]);
      mockBloqueoRepo.find.mockResolvedValue([bloqueo]);

      const result = await service.regenerarSlotsMedico(1);

      const allSlots = (mockSlotRepo.create as jest.Mock).mock.calls.map((c: any[]) => c[0]);
      // Expected 16 slots per Monday normally, but 10:00-11:00 (2 slots) are skipped = 14 on Feb 9
      // After Feb 9 the remaining 12 Mondays have 16 each = 192
      // Total = 14 + 192 = 206
      expect(result).toBe(206);

      for (const slot of allSlots) {
        const slotOk = slot.fin <= bloqueo.inicio || slot.inicio >= bloqueo.fin;
        expect(slotOk).toBe(true);
      }
    });

    it('17. limpia slots LIBRE futuros antes de regenerar', async () => {
      mockHorarioRepo.find.mockResolvedValue([horarioLunes]);
      mockBloqueoRepo.find.mockResolvedValue([]);

      await service.regenerarSlotsMedico(1);

      expect(mockQB.delete).toHaveBeenCalled();
      expect(mockQB.from).toHaveBeenCalledWith(SlotAgenda);
      expect(mockQB.where).toHaveBeenCalledWith('"medicoID" = :mid', { mid: 1 });
      expect(mockQB.andWhere).toHaveBeenCalledWith('estado = :est', { est: EstadoSlot.LIBRE });
      expect(mockQB.andWhere).toHaveBeenCalledWith('inicio >= :now', { now: expect.any(Date) });
      expect(mockQB.execute).toHaveBeenCalled();
    });

    it('18. guarda slots en lotes de 200', async () => {
      mockHorarioRepo.find.mockResolvedValue([horarioLunes]);
      mockBloqueoRepo.find.mockResolvedValue([]);

      await service.regenerarSlotsMedico(1);

      // 13 Mondays × 16 slots = 208, save called twice (200 + 8)
      expect(mockSlotRepo.save).toHaveBeenCalledTimes(2);
      expect((mockSlotRepo.save as jest.Mock).mock.calls[0][0]).toHaveLength(200);
      expect((mockSlotRepo.save as jest.Mock).mock.calls[1][0]).toHaveLength(8);
    });

    it('19. retorna 0 si el médico no tiene horarios', async () => {
      mockHorarioRepo.find.mockResolvedValue([]);

      const result = await service.regenerarSlotsMedico(1);

      expect(result).toBe(0);
      expect(mockSlotRepo.create).not.toHaveBeenCalled();
    });

    it('20. retorna el número total de slots creados', async () => {
      mockHorarioRepo.find.mockResolvedValue([horarioLunes]);
      mockBloqueoRepo.find.mockResolvedValue([]);

      const result = await service.regenerarSlotsMedico(1);

      expect(result).toBe(208);
      expect(mockSlotRepo.save).toHaveBeenCalled();
    });

    it('no crea slots para horarios con día de semana inválido', async () => {
      mockHorarioRepo.find.mockResolvedValue([
        { ...horarioLunes, diaSemana: 'invalidDay' } as any,
      ]);
      mockBloqueoRepo.find.mockResolvedValue([]);

      const result = await service.regenerarSlotsMedico(1);

      expect(result).toBe(0);
    });
  });
});
