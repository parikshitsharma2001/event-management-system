import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './controller/catalog';
import { CatalogService } from './service/catalog';
import { EventsCommand } from './repository/events.command';
import { EventsQuery } from './repository/events.query';
import { VenuesCommand } from './repository/venues.command';
import { VenuesQuery } from './repository/venues.query';
import { Venue } from './entities/venue';
import { Event } from './entities/event';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Venue])],
  controllers: [CatalogController],
  providers: [
    CatalogService,
    EventsCommand,
    EventsQuery,
    VenuesCommand,
    VenuesQuery,
  ]
})

export class CatalogModule { }
