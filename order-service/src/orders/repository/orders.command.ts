import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Ticket } from '../entities/ticket.entity';

interface CreateOrderData {
  idempotencyKey: string;
  userId: number;
  eventId: number;
  totalCents: number;
  taxCents: number;
}

@Injectable()
export class OrdersCommandRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,

    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) { }

  async createOrder(data: CreateOrderData): Promise<Order> {
    const order = this.orderRepo.create({
      idempotencyKey: data.idempotencyKey,
      userId: data.userId,
      eventId: data.eventId,
      totalCents: data.totalCents,
      taxCents: data.taxCents,
      status: 'PENDING',
    });
    return this.orderRepo.save(order);
  }

  async insertOrderItem(orderId: string, seatId: number, seatCode: string, seatPriceCents: number): Promise<void> {
    const item = this.itemRepo.create({
      order: { id: orderId } as any,
      seatId,
      seatCode,
      seatPriceCents,
    });
    await this.itemRepo.save(item);
  }

  async insertTicket(orderId: string, seatId: number, ticketCode: string): Promise<void> {
    const ticket = this.ticketRepo.create({
      order: { id: orderId } as any,
      seatId,
      ticketCode,
    });
    await this.ticketRepo.save(ticket);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    await this.orderRepo.update({ id: orderId }, { status, updatedAt: new Date() });
  }
}
