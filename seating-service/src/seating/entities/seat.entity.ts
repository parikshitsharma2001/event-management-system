import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
  Index,
} from 'typeorm';

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  ALLOCATED = 'ALLOCATED',
  BLOCKED = 'BLOCKED',
}

export enum SeatType {
  VIP = 'VIP',
  PREMIUM = 'PREMIUM',
  REGULAR = 'REGULAR',
  ECONOMY = 'ECONOMY',
}

@Entity({ name: 'seats' })
@Index(['eventId'])
@Index(['status'])
@Index(['eventId', 'status'])
@Index(['orderId'])
export class Seat {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id!: number;

  @Column({ name: 'event_id', type: 'bigint' })
  eventId!: number;

  @Column({ name: 'seat_number', type: 'varchar', length: 10 })
  seatNumber!: string;

  @Column({ name: 'row_number', type: 'varchar', length: 10 })
  rowNumber!: string;

  @Column({ name: 'section', type: 'varchar', length: 50 })
  section!: string;

  @Column({ name: 'type', type: 'varchar', length: 20, default: SeatType.REGULAR })
  type!: SeatType;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ name: 'status', type: 'varchar', length: 20, default: SeatStatus.AVAILABLE })
  status!: SeatStatus;

  @Column({ name: 'reserved_by', type: 'bigint', nullable: true })
  reservedBy!: number | null;

  @Column({ name: 'order_id', type: 'varchar', length: 36, nullable: true })
  orderId!: string | null;

  @Column({ name: 'reserved_at', type: 'timestamp', nullable: true })
  reservedAt!: Date | null;

  @Column({ name: 'reservation_expires_at', type: 'timestamp', nullable: true })
  reservationExpiresAt!: Date | null;

  @VersionColumn({ name: 'version' })
  version!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}