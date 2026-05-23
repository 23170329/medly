import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CitasService } from './citas.service';
import { Cita } from './entities/cita.entity';
import { SlotAgenda } from '../horarios/entities/slot-agenda.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { EstadoCita, EstadoPago, EstadoSlot, TipoPago } from '../common/enums';
import { PagosService } from '../pagos/pagos.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

describe('CitasService', () => {
  let service: CitasService;
  let mockCitaRepo: Record<string, jest.Mock>;
  let mockSlotRepo: Record<string, jest.Mock>;
  let mockDataSource: Record<string, jest.Mock>;
  let mockPagosService: Record<string, jest.Mock>;
  let mockNotificacionesService: Record<string, jest.Mock>;

  const slotLibre = {
    slotID: 1,
    medicoID: 10,
    sucursalID: 100,
    inicio: new Date('2026-06-01T10:00:00Z'),
    fin: new Date('2026-06-01T10:30:00Z'),
    estado: EstadoSlot.LIBRE,
  };

  const medicoConPrecio = {
    medicoID: 10,
    precioConsulta: '500.00',
  };

  const citaPendiente = {
    citaID: 1,
    pacienteID: 1,
    medicoID: 10,
    sucursalID: 100,
    slotID: 1,
    inicio: new Date('2026-06-01T10:00:00Z'),
    fin: new Date('2026-06-01T10:30:00Z'),
    estado: EstadoCita.PENDIENTE_PAGO,
    montoTotal: '500.00',
    montoAnticipo: '250.00',
    medico: { nombre: 'Juan', apellidoPat: 'Pérez', medicoID: 10 },
    paciente: { pacienteID: 1 },
    slot: { ...slotLibre },
    pagos: [
      {
        pagoID: 1,
        citaID: 1,
        monto: '250.00',
        tipo: TipoPago.ANTICIPO_50,
        estado: EstadoPago.PENDIENTE,
      },
    ],
  };

  const citaConfirmada = {
    ...citaPendiente,
    estado: EstadoCita.CONFIRMADA,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitasService,
        {
          provide: getRepositoryToken(Cita),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SlotAgenda),
          useValue: { findOne: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Pago),
          useValue: {},
        },
        {
          provide: DataSource,
          useValue: { transaction: jest.fn() },
        },
        {
          provide: PagosService,
          useValue: { reembolsarAnticipoSiAplica: jest.fn() },
        },
        {
          provide: NotificacionesService,
          useValue: { crear: jest.fn(), crearParaMedico: jest.fn() },
        },
        {
          provide: AuditoriaService,
          useValue: { registrar: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CitasService>(CitasService);
    mockCitaRepo = module.get(getRepositoryToken(Cita));
    mockSlotRepo = module.get(getRepositoryToken(SlotAgenda));
    mockDataSource = module.get(DataSource);
    mockPagosService = module.get(PagosService);
    mockNotificacionesService = module.get(NotificacionesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // crearReserva
  // ---------------------------------------------------------------------------
  describe('crearReserva', () => {
    function mockEmForCrearReserva() {
      const getOne = jest.fn();
      const where = jest.fn().mockReturnValue({ getOne });
      const setLock = jest.fn().mockReturnValue({ where });
      const createQueryBuilder = jest.fn().mockReturnValue({ setLock });
      return {
        getRepository: jest.fn().mockReturnValue({ createQueryBuilder }),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        __getOne: getOne,
        __setLock: setLock,
      };
    }

    it('should create reservation with pessimistic lock, 50% anticipo, PENDIENTE_PAGO cita and ANTICIPO_50/PENDIENTE pago', async () => {
      const em = mockEmForCrearReserva();
      em.__getOne.mockResolvedValue({ ...slotLibre });
      em.findOne.mockResolvedValue({ ...medicoConPrecio });
      const savedCita = { ...citaPendiente, citaID: 1 };
      em.create.mockReturnValue({});
      em.save
        .mockResolvedValueOnce({}) // slot
        .mockResolvedValueOnce(savedCita) // cita → returned
        .mockResolvedValueOnce({}); // pago
      mockDataSource.transaction.mockImplementation(
        async (cb: (em: any) => Promise<any>) => cb(em),
      );

      const result = await service.crearReserva(1, 1);

      expect(em.__setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(result).toEqual(savedCita);
      expect(result.citaID).toBe(1);
      expect(em.save).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ estado: EstadoSlot.RESERVADO }),
      );
      expect(em.save).toHaveBeenCalledTimes(3);
      expect(em.create).toHaveBeenCalledTimes(2);
      expect(em.create).toHaveBeenNthCalledWith(
        1,
        Cita,
        expect.objectContaining({
          pacienteID: 1,
          medicoID: 10,
          estado: EstadoCita.PENDIENTE_PAGO,
          montoTotal: '500.00',
          montoAnticipo: '250.00',
        }),
      );
      expect(em.create).toHaveBeenNthCalledWith(
        2,
        Pago,
        expect.objectContaining({
          citaID: 1,
          monto: '250.00',
          tipo: TipoPago.ANTICIPO_50,
          estado: EstadoPago.PENDIENTE,
        }),
      );
    });

    it('should throw BadRequestException when slot is not found', async () => {
      const em = mockEmForCrearReserva();
      em.__getOne.mockResolvedValue(null);
      mockDataSource.transaction.mockImplementation(
        async (cb: (em: any) => Promise<any>) => cb(em),
      );

      await expect(service.crearReserva(1, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.crearReserva(1, 1)).rejects.toThrow(
        'El horario ya no está disponible',
      );
    });

    it('should throw BadRequestException when slot is not LIBRE', async () => {
      const em = mockEmForCrearReserva();
      em.__getOne.mockResolvedValue({
        ...slotLibre,
        estado: EstadoSlot.OCUPADO,
      });
      mockDataSource.transaction.mockImplementation(
        async (cb: (em: any) => Promise<any>) => cb(em),
      );

      await expect(service.crearReserva(1, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.crearReserva(1, 1)).rejects.toThrow(
        'El horario ya no está disponible',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // abandonarPago
  // ---------------------------------------------------------------------------
  describe('abandonarPago', () => {
    it('should delete Pago, delete Cita and free slot in a transaction', async () => {
      const cita = {
        ...citaPendiente,
        slot: { ...slotLibre, estado: EstadoSlot.RESERVADO },
      };
      mockCitaRepo.findOne.mockResolvedValue(cita);

      const em = {
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        findOne: jest.fn().mockResolvedValue({ ...slotLibre, estado: EstadoSlot.RESERVADO }),
        save: jest.fn().mockResolvedValue({}),
      };
      mockDataSource.transaction.mockImplementation(
        async (cb: (em: any) => Promise<any>) => cb(em),
      );

      await service.abandonarPago(1, 1);

      expect(mockCitaRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { citaID: 1, pacienteID: 1 },
        }),
      );
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(em.delete).toHaveBeenCalledWith(Pago, { citaID: 1 });
      expect(em.delete).toHaveBeenCalledWith(Cita, { citaID: 1 });
      expect(em.findOne).toHaveBeenCalledWith(SlotAgenda, {
        where: { slotID: 1 },
      });
      expect(em.save).toHaveBeenCalledWith(
        expect.objectContaining({ estado: EstadoSlot.LIBRE }),
      );
    });

    it('should throw NotFoundException when cita does not exist', async () => {
      mockCitaRepo.findOne.mockResolvedValue(null);

      await expect(service.abandonarPago(1, 999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.abandonarPago(1, 999)).rejects.toThrow(
        'Cita no encontrada',
      );
    });

    it('should throw BadRequestException when cita is not PENDIENTE_PAGO', async () => {
      mockCitaRepo.findOne.mockResolvedValue({
        ...citaPendiente,
        estado: EstadoCita.CONFIRMADA,
      });

      await expect(service.abandonarPago(1, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.abandonarPago(1, 1)).rejects.toThrow(
        'La cita no está pendiente de pago',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // cancelar
  // ---------------------------------------------------------------------------
  describe('cancelar', () => {
    it('should cancel CONFIRMADA cita >24h before, process refund, set CANCELADA and free slot', async () => {
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const citaFutura = {
        ...citaConfirmada,
        inicio: futureDate,
        slot: { ...slotLibre, estado: EstadoSlot.RESERVADO },
      };
      mockCitaRepo.findOne.mockResolvedValue(citaFutura);
      mockPagosService.reembolsarAnticipoSiAplica.mockResolvedValue(true);

      const result = await service.cancelar(1, 1);

      expect(mockPagosService.reembolsarAnticipoSiAplica).toHaveBeenCalledWith(
        citaFutura,
      );
      expect(mockCitaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ estado: EstadoCita.CANCELADA }),
      );
      expect(mockSlotRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ estado: EstadoSlot.LIBRE }),
      );
      expect(result).toEqual({
        mensaje:
          'Cita cancelada. El anticipo será reembolsado según tu banco.',
        reembolsoProcesado: true,
      });
    });

    it('should cancel CONFIRMADA cita <24h before without refund and return policy message', async () => {
      const nearDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const citaCercana = {
        ...citaConfirmada,
        inicio: nearDate,
        slot: { ...slotLibre, estado: EstadoSlot.RESERVADO },
      };
      mockCitaRepo.findOne.mockResolvedValue(citaCercana);

      const result = await service.cancelar(1, 1);

      expect(
        mockPagosService.reembolsarAnticipoSiAplica,
      ).not.toHaveBeenCalled();
      expect(mockCitaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ estado: EstadoCita.CANCELADA }),
      );
      expect(result).toEqual({
        mensaje:
          'Cita cancelada. No aplica reembolso por política de menos de 24 horas.',
        reembolsoProcesado: false,
      });
    });

    it('should delegate to abandonarPago when cita is PENDIENTE_PAGO', async () => {
      const cita = {
        ...citaPendiente,
        slot: { ...slotLibre, estado: EstadoSlot.RESERVADO },
      };
      mockCitaRepo.findOne.mockResolvedValue(cita);

      const em = {
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
        findOne: jest.fn().mockResolvedValue({ ...slotLibre, estado: EstadoSlot.RESERVADO }),
        save: jest.fn().mockResolvedValue({}),
      };
      mockDataSource.transaction.mockImplementation(
        async (cb: (em: any) => Promise<any>) => cb(em),
      );

      const result = await service.cancelar(1, 1);

      expect(em.delete).toHaveBeenCalledWith(Pago, { citaID: 1 });
      expect(em.delete).toHaveBeenCalledWith(Cita, { citaID: 1 });
      expect(result).toEqual({
        mensaje: 'Reserva cancelada. El horario quedó liberado.',
        reembolsoProcesado: false,
      });
    });

    it('should throw BadRequestException for COMPLETADA cita', async () => {
      mockCitaRepo.findOne.mockResolvedValue({
        ...citaPendiente,
        estado: EstadoCita.COMPLETADA,
      });

      await expect(service.cancelar(1, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancelar(1, 1)).rejects.toThrow(
        'Solo se pueden cancelar citas confirmadas o pendientes de pago',
      );
    });

    it('should throw BadRequestException for CANCELADA cita', async () => {
      mockCitaRepo.findOne.mockResolvedValue({
        ...citaPendiente,
        estado: EstadoCita.CANCELADA,
      });

      await expect(service.cancelar(1, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancelar(1, 1)).rejects.toThrow(
        'Solo se pueden cancelar citas confirmadas o pendientes de pago',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // obtenerSiPaciente
  // ---------------------------------------------------------------------------
  describe('obtenerSiPaciente', () => {
    it('should return the cita when it belongs to the patient', async () => {
      mockCitaRepo.findOne.mockResolvedValue(citaPendiente);

      const result = await service.obtenerSiPaciente(1, 1);

      expect(result).toEqual(citaPendiente);
      expect(mockCitaRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { citaID: 1, pacienteID: 1 },
        }),
      );
    });

    it('should throw NotFoundException when cita is not found or not owned', async () => {
      mockCitaRepo.findOne.mockResolvedValue(null);

      await expect(service.obtenerSiPaciente(1, 999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.obtenerSiPaciente(1, 999)).rejects.toThrow(
        'Cita no encontrada',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // estadisticasPerfil
  // ---------------------------------------------------------------------------
  describe('estadisticasPerfil', () => {
    function mockQb() {
      const qb: Record<string, jest.Mock> = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getRawOne: jest.fn(),
      };
      return qb;
    }

    it('should return correct counts from raw query', async () => {
      const qb = mockQb();
      qb.getRawOne.mockResolvedValue({
        total: '5',
        completadas: '3',
        proximas: '1',
      });
      mockCitaRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.estadisticasPerfil(1);

      expect(result).toEqual({ total: 5, completadas: 3, proximas: 1 });
      expect(mockCitaRepo.createQueryBuilder).toHaveBeenCalledWith('c');
    });

    it('should return zeros when no citas exist', async () => {
      const qb = mockQb();
      qb.getRawOne.mockResolvedValue(null);
      mockCitaRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.estadisticasPerfil(1);

      expect(result).toEqual({ total: 0, completadas: 0, proximas: 0 });
    });
  });

  // ---------------------------------------------------------------------------
  // proximaCitaPaciente
  // ---------------------------------------------------------------------------
  describe('proximaCitaPaciente', () => {
    function mockQb() {
      const qb: Record<string, jest.Mock> = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      };
      return qb;
    }

    it('should return the next CONFIRMADA future cita', async () => {
      const qb = mockQb();
      qb.getOne.mockResolvedValue(citaConfirmada);
      mockCitaRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.proximaCitaPaciente(1);

      expect(result).toEqual(citaConfirmada);
    });

    it('should return null when no upcoming citas', async () => {
      const qb = mockQb();
      qb.getOne.mockResolvedValue(null);
      mockCitaRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.proximaCitaPaciente(1);

      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // listarCitasMedico
  // ---------------------------------------------------------------------------
  describe('listarCitasMedico', () => {
    it('should return all citas for the given medico', async () => {
      const citas = [citaPendiente, citaConfirmada];
      mockCitaRepo.find.mockResolvedValue(citas);

      const result = await service.listarCitasMedico(10);

      expect(result).toEqual(citas);
      expect(mockCitaRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { medicoID: 10 },
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // listarCitasPendientesAtencionMed
  // ---------------------------------------------------------------------------
  describe('listarCitasPendientesAtencionMed', () => {
    function mockQb() {
      const qb: Record<string, jest.Mock> = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
      };
      return qb;
    }

    it('should return future CONFIRMADA citas sorted ASC for the medico', async () => {
      const qb = mockQb();
      const citas = [citaConfirmada];
      qb.getMany.mockResolvedValue(citas);
      mockCitaRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.listarCitasPendientesAtencionMed(10);

      expect(result).toEqual(citas);
      expect(mockCitaRepo.createQueryBuilder).toHaveBeenCalledWith('c');
      expect(qb.orderBy).toHaveBeenCalledWith('c.inicio', 'ASC');
    });
  });

  // ---------------------------------------------------------------------------
  // cancelarPorMedico
  // ---------------------------------------------------------------------------
  describe('cancelarPorMedico', () => {
    it('should cancel CONFIRMADA cita >24h before, refund, free slot and send notification', async () => {
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const cita = {
        ...citaConfirmada,
        inicio: futureDate,
        medico: { nombre: 'Juan', apellidoPat: 'Pérez', medicoID: 10 },
        paciente: { pacienteID: 1 },
        slot: { ...slotLibre, estado: EstadoSlot.RESERVADO },
      };
      mockCitaRepo.findOne.mockResolvedValue(cita);
      mockPagosService.reembolsarAnticipoSiAplica.mockResolvedValue(true);
      mockNotificacionesService.crear.mockResolvedValue(undefined);

      const cancelacion = {
        causa: 'EMERGENCIA_MEDICA' as const,
        motivo: 'El médico tuvo una urgencia hospitalaria.',
      };
      const result = await service.cancelarPorMedico(10, 1, cancelacion);

      expect(mockCitaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: EstadoCita.CANCELADA,
          causaCancelacion: 'EMERGENCIA_MEDICA',
          motivoCancelacion: cancelacion.motivo,
        }),
      );
      expect(mockNotificacionesService.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          pacienteID: 1,
          titulo: 'Cita cancelada por el médico',
          permiteReagendar: true,
        }),
      );
      expect(mockNotificacionesService.crearParaMedico).toHaveBeenCalledWith(
        expect.objectContaining({
          medicoID: 10,
          titulo: 'Cita cancelada',
        }),
      );
      expect(result).toEqual({
        mensaje:
          'Cita cancelada. Reembolso de anticipo en proceso si aplica.',
        reembolsoProcesado: true,
      });
    });

    it('should not throw when notification creation fails', async () => {
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const cita = {
        ...citaConfirmada,
        inicio: futureDate,
        medico: { nombre: 'Juan', apellidoPat: 'Pérez', medicoID: 10 },
        paciente: { pacienteID: 1 },
        slot: { ...slotLibre, estado: EstadoSlot.RESERVADO },
      };
      mockCitaRepo.findOne.mockResolvedValue(cita);
      mockPagosService.reembolsarAnticipoSiAplica.mockResolvedValue(true);
      mockNotificacionesService.crear.mockRejectedValue(
        new Error('Network error'),
      );

      const result = await service.cancelarPorMedico(10, 1, {
        causa: 'OTRO',
        motivo: 'Motivo de prueba para cancelación.',
      });

      expect(mockCitaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ estado: EstadoCita.CANCELADA }),
      );
      expect(result).toEqual({
        mensaje:
          'Cita cancelada. Reembolso de anticipo en proceso si aplica.',
        reembolsoProcesado: true,
      });
    });
  });
});
