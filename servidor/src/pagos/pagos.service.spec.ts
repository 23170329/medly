import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { PagosService } from './pagos.service';
import { Pago } from './entities/pago.entity';
import { Cita } from '../citas/entities/cita.entity';
import { SlotAgenda } from '../horarios/entities/slot-agenda.entity';
import { EstadoCita, EstadoPago, EstadoSlot, TipoPago } from '../common/enums';

const mockStripeInstance = {
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  refunds: {
    create: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripeInstance);
});

describe('PagosService', () => {
  let service: PagosService;
  let pagoRepo: jest.Mocked<Repository<Pago>>;
  let citaRepo: jest.Mocked<Repository<Cita>>;
  let slotRepo: jest.Mocked<Repository<SlotAgenda>>;
  let configService: jest.Mocked<ConfigService>;

  const fakeStripeKey = 'sk_test_fake_key';

  const mockPagoPendiente: Partial<Pago> = {
    pagoID: 1,
    citaID: 1,
    tipo: TipoPago.ANTICIPO_50,
    estado: EstadoPago.PENDIENTE,
    stripeCheckoutSessionId: null,
    stripePaymentIntentId: null,
    monto: '250.00',
  };

  const mockCitaPendiente: Partial<Cita> = {
    citaID: 1,
    pacienteID: 1,
    medicoID: 1,
    estado: EstadoCita.PENDIENTE_PAGO,
    montoAnticipo: '250.00',
    pagos: [mockPagoPendiente as Pago],
    slot: { slotID: 1, estado: EstadoSlot.RESERVADO } as SlotAgenda,
  };

  beforeEach(async () => {
    mockStripeInstance.checkout.sessions.create.mockReset();
    mockStripeInstance.refunds.create.mockReset();
    mockStripeInstance.webhooks.constructEvent.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagosService,
        {
          provide: getRepositoryToken(Pago),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Cita),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SlotAgenda),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'STRIPE_SECRET_KEY') return fakeStripeKey;
              if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_fake';
              if (key === 'APP_PUBLIC_URL') return 'http://localhost:3000';
              if (key === 'PORT') return 3000;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PagosService>(PagosService);
    pagoRepo = module.get(getRepositoryToken(Pago));
    citaRepo = module.get(getRepositoryToken(Cita));
    slotRepo = module.get(getRepositoryToken(SlotAgenda));
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('crearCheckoutSession', () => {
    const pacienteId = 1;
    const citaID = 1;
    const sessionReturn = {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    };

    it('creates Stripe session, saves sessionId to pago, returns url+sessionId', async () => {
      citaRepo.findOne.mockResolvedValue(mockCitaPendiente as Cita);
      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        sessionReturn,
      );
      pagoRepo.save.mockResolvedValue(mockPagoPendiente as Pago);

      const result = await service.crearCheckoutSession(pacienteId, citaID);

      expect(citaRepo.findOne).toHaveBeenCalledWith({
        where: { citaID, pacienteID: pacienteId },
        relations: ['pagos'],
      });
      expect(
        mockStripeInstance.checkout.sessions.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          metadata: { citaId: '1', pacienteId: '1' },
        }),
      );
      expect(pagoRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          stripeCheckoutSessionId: 'cs_test_123',
        }),
      );
      expect(result).toEqual({
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        sessionId: 'cs_test_123',
      });
    });

    it('throws ServiceUnavailableException when stripe not configured', async () => {
      (service as any).stripe = null;

      await expect(
        service.crearCheckoutSession(pacienteId, citaID),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('throws NotFoundException when cita not found', async () => {
      citaRepo.findOne.mockResolvedValue(null);

      await expect(
        service.crearCheckoutSession(pacienteId, citaID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when cita not PENDIENTE_PAGO', async () => {
      citaRepo.findOne.mockResolvedValue({
        ...mockCitaPendiente,
        estado: EstadoCita.CONFIRMADA,
      } as Cita);

      await expect(
        service.crearCheckoutSession(pacienteId, citaID),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when no pending anticipo pago', async () => {
      citaRepo.findOne.mockResolvedValue({
        ...mockCitaPendiente,
        pagos: [],
      } as Cita);

      await expect(
        service.crearCheckoutSession(pacienteId, citaID),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when amount < 50 cents', async () => {
      citaRepo.findOne.mockResolvedValue({
        ...mockCitaPendiente,
        montoAnticipo: '0.30',
      } as Cita);

      await expect(
        service.crearCheckoutSession(pacienteId, citaID),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('procesarWebhook', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
      req = {
        headers: { 'stripe-signature': 't=123,v1=fakesig' },
        rawBody: Buffer.from('{"type":"checkout.session.completed"}'),
        body: null,
      };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn(),
      };
    });

    it('responds 503 when stripe not configured', async () => {
      (service as any).stripe = null;

      await service.procesarWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.send).toHaveBeenCalledWith('Stripe no configurado');
    });

    it('responds 400 when webhook signature is invalid', async () => {
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await service.procesarWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        'Webhook Error: Invalid signature',
      );
    });

    describe('checkout.session.completed', () => {
      const event = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: { citaId: '1', pacienteId: '1' },
            payment_intent: 'pi_test_123',
          },
        },
      };

      beforeEach(() => {
        mockStripeInstance.webhooks.constructEvent.mockReturnValue(event);
      });

      it('updates pago to COMPLETADO, cita to CONFIRMADA, slot to OCUPADO', async () => {
        const pago = { ...mockPagoPendiente } as Pago;
        const slot = { slotID: 1, estado: EstadoSlot.RESERVADO } as SlotAgenda;
        const cita = {
          ...mockCitaPendiente,
          pagos: [pago],
          slot,
        } as Cita;
        citaRepo.findOne.mockResolvedValue(cita);

        await service.procesarWebhook(req, res);

        expect(pagoRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({
            estado: EstadoPago.COMPLETADO,
            stripeCheckoutSessionId: 'cs_test_123',
            stripePaymentIntentId: 'pi_test_123',
          }),
        );
        expect(citaRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({
            estado: EstadoCita.CONFIRMADA,
          }),
        );
        expect(slotRepo.save).toHaveBeenCalledWith(
          expect.objectContaining({
            estado: EstadoSlot.OCUPADO,
          }),
        );
        expect(res.json).toHaveBeenCalledWith({ received: true });
      });

      it('responds json when no citaId in metadata', async () => {
        const noCitaEvent = {
          ...event,
          data: {
            object: {
              id: 'cs_test_456',
              metadata: {},
              payment_intent: 'pi_test_456',
            },
          },
        };
        mockStripeInstance.webhooks.constructEvent.mockReturnValue(noCitaEvent);

        await service.procesarWebhook(req, res);

        expect(res.json).toHaveBeenCalledWith({ received: true });
        expect(citaRepo.findOne).not.toHaveBeenCalled();
      });

      it('responds json without changes when cita not PENDIENTE_PAGO', async () => {
        citaRepo.findOne.mockResolvedValue({
          ...mockCitaPendiente,
          estado: EstadoCita.CONFIRMADA,
        } as Cita);

        await service.procesarWebhook(req, res);

        expect(res.json).toHaveBeenCalledWith({ received: true });
        expect(pagoRepo.save).not.toHaveBeenCalled();
        expect(slotRepo.save).not.toHaveBeenCalled();
      });
    });
  });

  describe('reembolsarAnticipoSiAplica', () => {
    const mockPagoCompletado: Partial<Pago> = {
      pagoID: 2,
      tipo: TipoPago.ANTICIPO_50,
      estado: EstadoPago.COMPLETADO,
      stripePaymentIntentId: 'pi_test_refund',
      monto: '250.00',
    };

    const mockCita: Partial<Cita> = {
      citaID: 1,
      pagos: [mockPagoCompletado as Pago],
    };

    it('creates Stripe refund, creates REEMBOLSO pago, returns true', async () => {
      mockStripeInstance.refunds.create.mockResolvedValue({ id: 're_test' });
      const reembolso = { pagoID: 3 } as Pago;
      pagoRepo.create.mockReturnValue(reembolso);
      pagoRepo.save.mockResolvedValue(reembolso);

      const result = await service.reembolsarAnticipoSiAplica(
        mockCita as Cita,
      );

      expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_refund',
      });
      expect(pagoRepo.create).toHaveBeenCalledWith({
        citaID: 1,
        monto: '250.00',
        tipo: TipoPago.REEMBOLSO,
        estado: EstadoPago.COMPLETADO,
      });
      expect(pagoRepo.save).toHaveBeenCalledWith(reembolso);
      expect(result).toBe(true);
    });

    it('returns false when stripe not configured', async () => {
      (service as any).stripe = null;

      const result = await service.reembolsarAnticipoSiAplica(
        mockCita as Cita,
      );

      expect(result).toBe(false);
      expect(mockStripeInstance.refunds.create).not.toHaveBeenCalled();
    });

    it('returns false when no completed anticipo pago found', async () => {
      const citaSinPago: Partial<Cita> = { citaID: 1, pagos: [] };

      const result = await service.reembolsarAnticipoSiAplica(
        citaSinPago as Cita,
      );

      expect(result).toBe(false);
    });

    it('returns false when no stripePaymentIntentId', async () => {
      const pagoSinIntent: Partial<Pago> = {
        ...mockPagoCompletado,
        stripePaymentIntentId: null,
      };
      const cita: Partial<Cita> = {
        citaID: 1,
        pagos: [pagoSinIntent as Pago],
      };

      const result = await service.reembolsarAnticipoSiAplica(cita as Cita);

      expect(result).toBe(false);
    });

    it('returns false when Stripe API error', async () => {
      mockStripeInstance.refunds.create.mockRejectedValue(
        new Error('Stripe error'),
      );

      const result = await service.reembolsarAnticipoSiAplica(
        mockCita as Cita,
      );

      expect(result).toBe(false);
    });
  });

  describe('redirectExitoHtml', () => {
    it('returns HTML with deep link redirect', () => {
      const html = service.redirectExitoHtml('cs_test_123');

      expect(html).toContain('medly://pagos/exito');
      expect(html).toContain('session_id=cs_test_123');
      expect(html).toContain('Pago recibido');
    });
  });

  describe('redirectCanceladoHtml', () => {
    it('returns HTML with deep link redirect', () => {
      const html = service.redirectCanceladoHtml('42');

      expect(html).toContain('medly://pagos/cancelado');
      expect(html).toContain('cita_id=42');
      expect(html).toContain('Pago cancelado');
    });
  });
});
