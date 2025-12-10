import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Ticket } from './ticket.entity';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'FAILED'
  | 'REFUNDED';

@Entity({ name: 'orders' })
@Unique(['idempotencyKey'])
export class Order {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'idempotency_key', type: 'text', nullable: true, unique: true })
  idempotencyKey!: string | null;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId!: number | null;

  @Column({ name: 'event_id', type: 'int', nullable: true })
  eventId!: number | null;

  @Column({ name: 'total_cents', type: 'int', default: 0 })
  totalCents!: number;

  @Column({ name: 'tax_cents', type: 'int', default: 0 })
  taxCents!: number;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'PENDING',
  })
  status!: OrderStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  @OneToMany(() => Ticket, (ticket) => ticket.order, { cascade: true })
  tickets!: Ticket[];
}
