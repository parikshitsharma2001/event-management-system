import { Body, Controller, Get, Param, Post, Req, Res, HttpException } from '@nestjs/common';
import { CreateChargeAPIDto } from '../dto/create-charge.dto';
import { RefundDto } from '../dto/refund.dto';
import { Request, Response } from 'express';
import { PaymentsService } from '../service/payments';
import * as os from 'os';
import * as client from 'prom-client';

// --- PROMETHEUS SETUP --- //
const register = new client.Registry();

// Collect default process and system metrics
client.collectDefaultMetrics({ register });

// Custom counters
const paymentsTotal = new client.Counter({
  name: 'payments_total',
  help: 'Total number of payment attempts',
});

const paymentsFailedTotal = new client.Counter({
  name: 'payments_failed_total',
  help: 'Total number of failed payments',
});

const refundsTotal = new client.Counter({
  name: 'refunds_total',
  help: 'Total number of refunds processed',
});

register.registerMetric(paymentsTotal);
register.registerMetric(paymentsFailedTotal);
register.registerMetric(refundsTotal);


@Controller()
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) { }

  @Get('health')
  health() {
    return { ok: true, service: 'payment-service' };
  }

  // ✅ Proper Prometheus endpoint
  @Get('metrics')
  async getMetrics(@Res() res: Response) {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  }


  @Post('v1/charge')
  async charge(@Req() req: Request, @Body() body: CreateChargeAPIDto, @Res() res: Response) {
    const idempotencyKey = req.header('Idempotency-Key');
    if (!idempotencyKey) return res.status(400).json({ error: 'Idempotency-Key required' });

    try {
      const payment = await this.paymentsService.createCharge(idempotencyKey, {
        merchant_order_id: body.merchant_order_id,
        amount_cents: body.amount_cents,
        currency: body.currency
      });
      // Increment success counter
      paymentsTotal.inc();
      return res.json({
        id: payment.id,
        merchant_order_id: payment.merchantOrderId,
        provider_txn_id: payment.providerTxnId,
        status: payment.status,
        amount_cents: payment.amountCents,
        currency: payment.currency
      });
    } catch (err: any) {
      throw new HttpException(err.message || 'internal', err.status || 500);
    }
  }

  @Post('v1/refund')
  async refund(@Body() body: RefundDto, @Res() res: Response) {
    try {
      const refunded = await this.paymentsService.refund(body.payment_id);
      // Increment refund counter
      refundsTotal.inc();
      return res.json({ id: refunded.id, status: refunded.status });
    } catch (err: any) {
      throw new HttpException(err.message || 'internal', err.status || 500);
    }
  }

  @Get('v1/payments/:id')
  async getById(@Param('id') id: string, @Res() res: Response) {
    const payment = await this.paymentsService.findById(id);
    if (!payment) return res.status(404).json({ error: 'not found' });
    return res.json(payment);
  }
}
