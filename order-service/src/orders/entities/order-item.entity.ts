import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity({ name: 'order_items' })
export class OrderItem {
  @PrimaryGeneratedColumn({ name: 'id' })
  id!: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'seat_id', type: 'int' })
  seatId!: number;

  @Column({ name: 'seat_code', type: 'text', nullable: true })
  seatCode!: string | null;

  @Column({ name: 'seat_price_cents', type: 'int', default: 0 })
  seatPriceCents!: number;
}
