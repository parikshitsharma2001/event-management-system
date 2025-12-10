import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Event } from '../entities/event';

@Injectable()
export class EventsCommand {
  constructor(
    @InjectRepository(Event) private readonly repo: Repository<Event>,
  ) { }

  async createEvent(data: Partial<Event>): Promise<Event> {
    const event = this.repo.create({
      venue_id: data.venue_id,
      title: data.title,
      type: data.type ?? null,
      start_time: new Date(data.start_time!),
      end_time: data.end_time ? new Date(data.end_time) : null,
      status: data.status ?? 'ON_SALE',
      description: data.description ?? null,
    } as DeepPartial<Event>);
    return this.repo.save(event);
  }

  async updateEvent(id: number, patch: Partial<Event>) {
    return this.repo.update(id, patch);
  }

  async deleteEvent(id: number) {
    return this.repo.delete(id);
  }
}
