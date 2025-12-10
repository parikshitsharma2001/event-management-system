import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Order } from './order.entity';

@Entity({ name: 'tickets' })
@Unique(['ticketCode'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @ManyToOne(() => Order, (order: { tickets: any; }) => order.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'seat_id', type: 'int' })
  seatId!: number;

  @Column({ name: 'ticket_code', type: 'text', unique: true })
  ticketCode!: string;

  @CreateDateColumn({ name: 'issued_at' })
  issuedAt!: Date;
}
