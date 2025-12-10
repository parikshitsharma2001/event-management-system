import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Venue } from './venue';

@Entity({ name: 'events' })
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Venue, (venue) => venue.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venue_id' })
  venue!: Venue;

  @Column({ type: 'int' })
  venue_id!: number;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  type!: string;

  @Column({ type: 'timestamp' })
  start_time!: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time!: Date;

  @Column({ type: 'text', default: 'ON_SALE' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;
}
