import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
// Stripe SDK: en CommonJS (Nest build) preferimos require para evitar problemas con default export
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require('stripe');
type StripeInstance = any;
import { Request, Response } from 'express';
import { Pago } from './entities/pago.entity';
import { Cita } from '../citas/entities/cita.entity';
import { SlotAgenda } from '../horarios/entities/slot-agenda.entity';
import {
  EstadoCita,
  EstadoPago,
  EstadoSlot,
  TipoPago,
} from '../common/enums';

@Injectable()
export class PagosService {
  private stripe: StripeInstance | null;

  constructor(
    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,
    @InjectRepository(Cita)
    private readonly citaRepo: Repository<Cita>,
    @InjectRepository(SlotAgenda)
    private readonly slotRepo: Repository<SlotAgenda>,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key ? new Stripe(key) : null;
  }

  async crearCheckoutSession(
    pacienteId: number,
    citaID: number,
  ): Promise<{ url: string | null; sessionId: string }> {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        'Pagos no configurados (STRIPE_SECRET_KEY)',
      );
    }

    const cita = await this.citaRepo.findOne({
      where: { citaID, pacienteID: pacienteId },
      relations: ['pagos'],
    });
    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }
    if (cita.estado !== EstadoCita.PENDIENTE_PAGO) {
      throw new BadRequestException('La cita no está pendiente de pago');
    }

    const pagoPendiente = cita.pagos?.find(
      (p) =>
        p.tipo === TipoPago.ANTICIPO_50 && p.estado === EstadoPago.PENDIENTE,
    );
    if (!pagoPendiente) {
      throw new BadRequestException('No hay anticipo pendiente');
    }

    const anticipo = parseFloat(String(cita.montoAnticipo));
    const cents = Math.round(anticipo * 100);
    if (cents < 50) {
      throw new BadRequestException('Monto de anticipo inválido');
    }

    const base =
      this.config.get<string>('APP_PUBLIC_URL') ??
      `http://localhost:${this.config.get('PORT') ?? 3000}`;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'Anticipo consulta Medly (50%)',
              description: `Cita #${citaID}`,
            },
            unit_amount: cents,
          },
          quantity: 1,
        },
      ],
      success_url: `${base}/pagos/redirect/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/pagos/redirect/cancelado?cita_id=${citaID}`,
      metadata: {
        citaId: String(citaID),
        pacienteId: String(pacienteId),
      },
      payment_intent_data: {
        metadata: {
          citaId: String(citaID),
        },
      },
    });

    pagoPendiente.stripeCheckoutSessionId = session.id;
    await this.pagoRepo.save(pagoPendiente);

    return { url: session.url, sessionId: session.id };
  }

  async procesarWebhook(req: Request, res: Response): Promise<void> {
    if (!this.stripe) {
      res.status(503).send('Stripe no configurado');
      return;
    }

    const sig = req.headers['stripe-signature'];
    const whSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

    let event: { type: string; data: { object: Record<string, unknown> } };

    try {
      if (whSecret && sig && rawBody) {
        event = this.stripe.webhooks.constructEvent(
          rawBody,
          sig as string,
          whSecret,
        ) as unknown as typeof event;
      } else if (req.body && typeof req.body === 'object') {
        event = req.body as typeof event;
      } else {
        res.status(400).send('Body inválido');
        return;
      }
    } catch (err) {
      res.status(400).send(`Webhook Error: ${(err as Error).message}`);
      return;
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as {
          id?: string;
          metadata?: Record<string, string>;
          payment_intent?: string | { id?: string };
        };
        const citaId = parseInt(
          session.metadata?.citaId ?? session.metadata?.cita_id ?? '0',
          10,
        );
        if (!citaId) {
          res.json({ received: true });
          return;
        }

        const cita = await this.citaRepo.findOne({
          where: { citaID: citaId },
          relations: ['pagos', 'slot'],
        });
        if (!cita || cita.estado !== EstadoCita.PENDIENTE_PAGO) {
          res.json({ received: true });
          return;
        }

        const pi = session.payment_intent;
        const intentId =
          typeof pi === 'string' ? pi : pi && typeof pi === 'object'
            ? (pi as { id?: string }).id
            : undefined;

        for (const p of cita.pagos ?? []) {
          if (
            p.tipo === TipoPago.ANTICIPO_50 &&
            p.estado === EstadoPago.PENDIENTE
          ) {
            p.estado = EstadoPago.COMPLETADO;
            p.stripeCheckoutSessionId = session.id ?? null;
            if (intentId) {
              p.stripePaymentIntentId = intentId;
            }
            await this.pagoRepo.save(p);
          }
        }

        cita.estado = EstadoCita.CONFIRMADA;
        await this.citaRepo.save(cita);

        if (cita.slot) {
          cita.slot.estado = EstadoSlot.OCUPADO;
          await this.slotRepo.save(cita.slot);
        }
      }
    } catch (e) {
      console.error(e);
      res.status(500).send('Error procesando evento');
      return;
    }

    res.json({ received: true });
  }

  redirectExitoHtml(sessionId: string): string {
    const deep = `medly://pagos/exito?session_id=${encodeURIComponent(sessionId)}`;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Pago recibido</title></head><body><p>Pago recibido. Puedes cerrar esta ventana y volver a Medly.</p><script>location.href=${JSON.stringify(deep)}</script></body></html>`;
  }

  redirectCanceladoHtml(citaId: string): string {
    const deep = `medly://pagos/cancelado?cita_id=${encodeURIComponent(citaId)}`;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body><p>Pago cancelado.</p><script>location.href=${JSON.stringify(deep)}</script></body></html>`;
  }

  /** Reembolso del anticipo por cancelación con más de 24 h de anticipación */
  async reembolsarAnticipoSiAplica(cita: Cita): Promise<boolean> {
    if (!this.stripe) {
      return false;
    }
    const pagoAnticipo = cita.pagos?.find(
      (p) =>
        p.tipo === TipoPago.ANTICIPO_50 && p.estado === EstadoPago.COMPLETADO,
    );
    if (!pagoAnticipo?.stripePaymentIntentId) {
      return false;
    }
    try {
      await this.stripe.refunds.create({
        payment_intent: pagoAnticipo.stripePaymentIntentId,
      });
      const reb = this.pagoRepo.create({
        citaID: cita.citaID,
        monto: pagoAnticipo.monto,
        tipo: TipoPago.REEMBOLSO,
        estado: EstadoPago.COMPLETADO,
      });
      await this.pagoRepo.save(reb);
      return true;
    } catch {
      return false;
    }
  }
}
