import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Query,
  Req,
  Res,
  HttpException,
  ParseIntPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SeatingService } from '../service/seating.service';
import {
  CreateSeatDto,
  SeatReservationRequest,
  SeatAllocationRequest,
} from '../dto/seating.dto';
import { SeatStatus } from '../entities/seat.entity';

@Controller()
export class SeatingController {
  constructor(private readonly seatingService: SeatingService) { }

  @Get('health')
  health() {
    return { ok: true, service: 'seating-service' };
  }

  @Get('v1/seats/availability')
  async getSeatAvailability(@Query('eventId', ParseIntPipe) eventId: number) {
    try {
      return await this.seatingService.getSeatAvailability(eventId);
    } catch (err: any) {
      throw new HttpException(err.message || 'internal', err.status || 500);
    }
  }

  @Get('v1/seats')
  async getSeats(
    @Query('eventId', ParseIntPipe) eventId: number,
    @Query('status') status?: string,
  ) {
    try {
      const seatStatus = status ? (status.toUpperCase() as SeatStatus) : undefined;
      return await this.seatingService.getSeatsByEventId(eventId, seatStatus);
    } catch (err: any) {
      throw new HttpException(err.message || 'internal', err.status || 500);
    }
  }

  @Get('v1/seats/:id')
  async getSeatById(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.seatingService.getSeatById(id);
    } catch (err: any) {
      throw new HttpException(err.message || 'internal', err.status || 500);
    }
  }

  @Get('v1/seats/order/:orderId')
  async getSeatsByOrderId(@Param('orderId') orderId: string) {
    try {
      return await this.seatingService.getSeatsByOrderId(orderId);
    } catch (err: any) {
      throw new HttpException(err.message || 'internal', err.status || 500);
    }
  }

  @Post('v1/seats/reserve')
  async reserveSeats(
    @Req() req: Request,
    @Body() body: SeatReservationRequest,
    @Res() res: Response,
  ) {
    const idempotencyKey = req.header('Idempotency-Key');

    try {
      const result = await this.seatingService.reserveSeats(body);
      return res.json(result);
    } catch (err: any) {
      throw new HttpException(err.message || 'internal', err.status || 500);
    }
  }

  @Post('v1/seats/allocate')
  async allocateSeats(@Body() body: SeatAllocationRequest, @Res() res: Response) {
    try {
      await this.seatingService.allocateSeats(body);
      return res.json({ message: 'Seats allocated successfully' });
    } catch (err: any) {
      throw new HttpException(err.message || 'internal', err.status || 500);
    }
  }

  @Post('v1/seats/release')
  async releaseSeats(@Body() seatIds: number[], @Res() res: Response) {
    try {
      await this.seatingService.releaseSeats(seatIds);
      return res.json({ message: 'Seats released successfully' });
    } catch (err: any) {
      throw new HttpException(err.message || 'internal', err.status || 500);
    }
  }

  @Post('v1/seats')
  async createSeat(@Body() body: CreateSeatDto, @Res() res: Response) {
    try {
      const seat = await this.seatingService.createSeat(body);
      return res.status(201).json(seat);
    } catch (err: any) {
      throw new HttpException(err.message || 'internal', err.status || 500);
    }
  }

  @Patch('v1/seats/:id/block')
  async blockSeat(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      await this.seatingService.blockSeat(id);
      return res.json({ message: 'Seat blocked successfully' });
    } catch (err: any) {
      throw new HttpException(err.message || 'internal', err.status || 500);
    }
  }

  @Patch('v1/seats/:id/unblock')
  async unblockSeat(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      await this.seatingService.unblockSeat(id);
      return res.json({ message: 'Seat unblocked successfully' });
    } catch (err: any) {
      throw new HttpException(err.message || 'internal', err.status || 500);
    }
  }
}
