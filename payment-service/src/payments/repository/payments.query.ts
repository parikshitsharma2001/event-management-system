import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class PaymentsQueryRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
  ) { }

  async findById(id: string): Promise<Payment | null> {
    return this.repo.findOneBy({ id });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<Payment | null> {
    return this.repo.findOneBy({ idempotencyKey });
  }

  async findAll(limit = 100): Promise<Payment[]> {
    return this.repo.find({ take: limit, order: { createdAt: 'DESC' } });
  }
}
