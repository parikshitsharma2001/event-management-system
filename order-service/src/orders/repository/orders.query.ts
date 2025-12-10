import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Ticket } from '../entities/ticket.entity';

@Injectable()
export class OrdersQueryRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,

    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) { }

  async findById(id: string): Promise<Order | null> {
    return this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'tickets'],
    });
  }

  async findByIdempotency(key: string): Promise<Order | null> {
    return this.orderRepo.findOne({ where: { idempotencyKey: key } });
  }

  async findOrderItems(orderId: string): Promise<OrderItem[]> {
    return this.itemRepo.find({
      where: { order: { id: orderId } },
    });
  }

  async findTickets(orderId: string): Promise<Ticket[]> {
    return this.ticketRepo.find({
      where: { order: { id: orderId } },
    });
  }
}
