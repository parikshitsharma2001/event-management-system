import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Event } from './event';

@Entity({ name: 'venues' })
export class Venue {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @OneToMany(() => Event, (event) => event.venue)
  events!: Event[];
}
