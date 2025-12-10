import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { CreateChargeAPIDto } from '../dto/create-charge.dto';
import { Payment } from '../entities/payment.entity';
import { PaymentsQueryRepository } from '../repository/payments.query';
import { PaymentsCommandRepository } from '../repository/payment.command';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly orderCallbackUrl = process.env.ORDER_CALLBACK_URL;

  constructor(
    private readonly queryRepo: PaymentsQueryRepository,
    private readonly commandRepo: PaymentsCommandRepository,
  ) { }

  async createCharge(idempotencyKey: string, data: CreateChargeAPIDto): Promise<Payment> {
    const existingCharge = await this.queryRepo.findByIdempotencyKey(idempotencyKey);
    if (existingCharge) return existingCharge;

    const created = await this.commandRepo.createPendingPayment({
      merchantOrderId: data.merchant_order_id,
      idempotencyKey,
      amountCents: data.amount_cents,
      currency: data.currency,
    });

    const providerTxnId = 'TXN-' + uuidv4();

    // For random success and failure
    const mockSuccess = (data.amount_cents % 10) !== 7;
    const status: Payment['status'] = mockSuccess ? 'SUCCESS' : 'FAILED';

    const updated = await this.commandRepo.updateStatusAndProviderTxnId(created.id, status, providerTxnId);
    if (!updated) throw new NotFoundException('Payment not found after update');

    try {
      await axios.post(this.orderCallbackUrl!, {
        order_id: data.merchant_order_id,
        payment_id: updated.id,
        status,
      }, { timeout: 2000 });
    } catch (err: any) {
      this.logger.warn('Order callback failed: ' + (err.message ?? err));
      throw err;
    }

    return updated;
  }

  async refund(paymentId: string): Promise<Payment> {
    const payment = await this.queryRepo.findById(paymentId);
    if (!payment) throw new NotFoundException('not found');

    if (payment.status !== 'SUCCESS') throw new BadRequestException('only successful payments can be refunded');

    const updated = await this.commandRepo.markRefunded(paymentId);
    if (!updated) throw new NotFoundException('Payment not found after refund update');
    return updated;
  }

  async findById(id: string): Promise<Payment | null> {
    return this.queryRepo.findById(id);
  }
}
