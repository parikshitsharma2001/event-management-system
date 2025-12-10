import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, Unique } from 'typeorm';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

@Entity({ name: 'payments' })
@Unique(['idempotencyKey'])
export class Payment {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'merchant_order_id', type: 'uuid', nullable: true })
  merchantOrderId!: string | null;

  @Column({ name: 'idempotency_key', type: 'text', nullable: true, unique: true })
  idempotencyKey!: string | null;

  @Column({ name: 'amount_cents', type: 'int', default: 0 })
  amountCents!: number;

  @Column({ name: 'currency', type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'PENDING', nullable: true })
  status!: PaymentStatus;

  @Column({ name: 'provider_txn_id', type: 'text', nullable: true })
  providerTxnId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
