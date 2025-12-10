import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { CreateChargeDBDto } from '../dto/create-charge.dto';

@Injectable()
export class PaymentsCommandRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
  ) { }

  async createPendingPayment(payload: CreateChargeDBDto): Promise<Payment> {
    const payment = this.repo.create({
      merchantOrderId: payload.merchantOrderId,
      idempotencyKey: payload.idempotencyKey,
      amountCents: payload.amountCents,
      currency: payload.currency,
      status: 'PENDING',
      providerTxnId: null,
    });
    return this.repo.save(payment);
  }

  async updateStatusAndProviderTxnId(paymentId: string, status: Payment['status'], providerTxnId: string): Promise<Payment | null> {
    await this.repo.update({ id: paymentId }, { status, providerTxnId, updatedAt: new Date() });
    const updated = await this.repo.findOneBy({ id: paymentId });
    return updated;
  }

  async markRefunded(paymentId: string): Promise<Payment | null> {
    await this.repo.update({ id: paymentId }, { status: 'REFUNDED', updatedAt: new Date() });
    const updated = await this.repo.findOneBy({ id: paymentId });
    return updated;
  }

  async save(payment: Payment): Promise<Payment> {
    return this.repo.save(payment);
  }
}
