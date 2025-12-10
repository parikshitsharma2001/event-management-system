import { Controller, Get, Post, Body, Param, Query, Res, HttpStatus, UsePipes, ValidationPipe, ParseIntPipe } from '@nestjs/common';
import { CatalogService } from '../service/catalog';
import { Response } from 'express';
import { CreateVenueDto } from '../dto/venue.dto';
import { CreateEventDto, ListEventsQueryDto } from '../dto/event.dto';
import * as client from 'prom-client';

// --- PROMETHEUS METRICS SETUP --- //
const register = new client.Registry();

// collect default Node.js metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics({ register });

// define custom metrics for this service
const eventsCreatedTotal = new client.Counter({
  name: 'catalog_events_created_total',
  help: 'Total number of events created',
});

const venuesCreatedTotal = new client.Counter({
  name: 'catalog_venues_created_total',
  help: 'Total number of venues created',
});

const eventsListedTotal = new client.Counter({
  name: 'catalog_events_listed_total',
  help: 'Total number of event listing requests',
});

register.registerMetric(eventsCreatedTotal);
register.registerMetric(venuesCreatedTotal);
register.registerMetric(eventsListedTotal);

@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) { }

  @Get('/health')
  health(@Res() response: Response) {
    return response
      .status(HttpStatus.OK)
      .json({ ok: true, service: 'catalog-service' });
  }

  // ✅ PROMETHEUS METRICS ENDPOINT
  @Get('/metrics')
  async getMetrics(@Res() response: Response) {
    response.setHeader('Content-Type', register.contentType);
    response.send(await register.metrics());
  }

  @Post('/v1/venues')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  async createVenue(
    @Body() createVenueDto: CreateVenueDto,
    @Res() response: Response
  ) {
    try {
      const createdVenue = await this.catalogService.createVenue(createVenueDto);
      // increment Prometheus counter
      venuesCreatedTotal.inc();

      return response.status(HttpStatus.CREATED).json(createdVenue);
    } catch (error) {
      console.error(error);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: JSON.stringify(error),
      });
    }
  }

  @Post('/v1/events')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @Res() response: Response,
  ) {
    try {
      const createdEvent = await this.catalogService.createEvent(createEventDto);
      // increment Prometheus counter
      eventsCreatedTotal.inc();

      return response.status(HttpStatus.CREATED).json(createdEvent);
    } catch (error) {
      console.error(error);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: JSON.stringify(error),
      });
    }
  }

  @Get('/v1/events')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async listEvents(
    @Query() query: ListEventsQueryDto,
    @Res() response: Response,
  ) {
    try {
      const eventsList = await this.catalogService.listEvents({
        city: query.city,
        type: query.type,
        status: query.status,
      });

      // count listing operations
      eventsListedTotal.inc();

      return response.json(eventsList);
    } catch (error) {
      console.error(error);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: JSON.stringify(error),
      });
    }
  }

  @Get('/v1/events/:id')
  async getEvent(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    try {
      const eventDetails = await this.catalogService.getEventById(id);
      if (!eventDetails) {
        return response.status(HttpStatus.NOT_FOUND).json({ error: 'not found' });
      }
      return response.json(eventDetails);
    } catch (error) {
      console.error(error);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: JSON.stringify(error),
      });
    }
  }
}
