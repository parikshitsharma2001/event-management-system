import { Injectable, Logger } from '@nestjs/common';
import { EventsCommand } from '../repository/events.command';
import { EventsQuery } from '../repository/events.query';
import { VenuesCommand } from '../repository/venues.command';
import { CreateVenueDto } from '../dto/venue.dto';
import { CreateEventDto, EventsFilterDto } from '../dto/event.dto';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(
    private readonly eventsCmd: EventsCommand,
    private readonly eventsQry: EventsQuery,
    private readonly venuesCmd: VenuesCommand,
  ) { }

  async createVenue(payload: CreateVenueDto) {
    return this.venuesCmd.createVenue(payload);
  }

  async createEvent(payload: CreateEventDto) {
    return this.eventsCmd.createEvent(payload);
  }

  async listEvents(filters: EventsFilterDto) {
    return this.eventsQry.listEvents(filters);
  }

  async getEventById(id: number | string) {
    return this.eventsQry.getEventById(id);
  }
}
