import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { Seat, SeatStatus } from '../entities/seat.entity';
import { SeatingQueryRepository } from '../repository/seating.query';
import { SeatingCommandRepository } from '../repository/seating.command';
import {
  CreateSeatDto,
  SeatReservationRequest,
  SeatReservationResponse,
  SeatAllocationRequest,
  SeatAvailabilityResponse,
} from '../dto/seating.dto';
import { createRedisClient } from '../../config/redis';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class SeatingService {
  private readonly logger = new Logger(SeatingService.name);
  private readonly redis: Redis;
  private readonly RESERVATION_TTL_MINUTES = 15;
  private readonly REDIS_KEY_PREFIX = 'seat:reservation:';

  constructor(
    private readonly queryRepo: SeatingQueryRepository,
    private readonly commandRepo: SeatingCommandRepository,
    private readonly dataSource: DataSource, // inject TypeORM DataSource
  ) {
    this.redis = createRedisClient();
  }

  async getSeatAvailability(eventId: number): Promise<SeatAvailabilityResponse> {
    this.logger.log(`Fetching seat availability for event: ${eventId}`);

    const allSeats = await this.queryRepo.findByEventId(eventId);

    if (allSeats.length === 0) {
      throw new NotFoundException(`No seats found for event: ${eventId}`);
    }

    const availableSeats = allSeats.filter((seat) => seat.status === SeatStatus.AVAILABLE);
    const reservedCount = allSeats.filter((seat) => seat.status === SeatStatus.RESERVED).length;
    const allocatedCount = allSeats.filter((seat) => seat.status === SeatStatus.ALLOCATED).length;

    const availabilityBySection = availableSeats.reduce((acc, seat) => {
      acc[seat.section] = (acc[seat.section] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      eventId,
      totalSeats: allSeats.length,
      availableSeats: availableSeats.length,
      reservedSeats: reservedCount,
      allocatedSeats: allocatedCount,
      availableSeatsList: availableSeats,
      availabilityBySection,
    };
  }

  async getSeatsByEventId(eventId: number, status?: SeatStatus): Promise<Seat[]> {
    this.logger.log(`Fetching seats for event: ${eventId}, status: ${status}`);

    if (status) {
      return this.queryRepo.findByEventIdAndStatus(eventId, status);
    }

    return this.queryRepo.findByEventId(eventId);
  }

  async getSeatById(id: number): Promise<Seat> {
    this.logger.log(`Fetching seat by ID: ${id}`);
    const seat = await this.queryRepo.findById(id);
    if (!seat) {
      throw new NotFoundException(`Seat not found with id: ${id}`);
    }
    return seat;
  }

  async getSeatsByOrderId(orderId: string): Promise<Seat[]> {
    this.logger.log(`Fetching seats for order: ${orderId}`);
    return this.queryRepo.findByOrderId(orderId);
  }

  async reserveSeats(request: SeatReservationRequest): Promise<SeatReservationResponse> {
    this.logger.log(
      `Reserving seats for event: ${request.eventId}, seatIds: ${request.seatIds}, userId: ${request.userId}`,
    );

    // run DB operations inside a transaction
    const txResult = await this.dataSource.manager.transaction(async (manager: EntityManager) => {
      // fetch with pessimistic lock using transactional manager
      const seats = await this.queryRepo.findByIdsWithLock(request.seatIds, manager);

      if (seats.length !== request.seatIds.length) {
        throw new NotFoundException('Some seats not found');
      }

      // Validate all seats belong to the same event
      if (!seats.every((seat) => seat.eventId === request.eventId)) {
        throw new BadRequestException('All seats must belong to the same event');
      }

      // Check availability
      const unavailableSeats = seats.filter((seat) => seat.status !== SeatStatus.AVAILABLE);
      if (unavailableSeats.length > 0) {
        throw new ConflictException(
          `Seats are not available: ${unavailableSeats.map((s) => s.seatNumber).join(', ')}`,
        );
      }

      // Reserve seats
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.RESERVATION_TTL_MINUTES * 60 * 1000);
      const reservationId = uuidv4();

      seats.forEach((seat) => {
        seat.status = SeatStatus.RESERVED;
        seat.reservedBy = request.userId;
        seat.reservedAt = now;
        seat.reservationExpiresAt = expiresAt;
      });

      // persist using transactional manager
      const saved: Seat[] = [];
      for (const seat of seats) {
        const s = await manager.save(seat);
        saved.push(s);
      }

      return { saved, reservationId, expiresAt };
    });

    // after commit
    const { saved: committedSeats, reservationId, expiresAt } = txResult;

    // Store reservation in Redis with TTL
    const redisKey = `${this.REDIS_KEY_PREFIX}${reservationId}`;
    const reservationData = {
      userId: request.userId,
      eventId: request.eventId,
      seatIds: request.seatIds,
      expiresAt: expiresAt.toISOString(),
    };

    await this.redis.setex(redisKey, this.RESERVATION_TTL_MINUTES * 60, JSON.stringify(reservationData));

    // Schedule expiration check (outside transaction)
    this.scheduleReservationExpiry(reservationId, request.seatIds);

    const totalPrice = committedSeats.reduce((sum: number, seat: Seat) => sum + Number(seat.price ?? 0), 0);

    this.logger.log(`Successfully reserved ${committedSeats.length} seats for user: ${request.userId}`);

    return {
      success: true,
      message: 'Seats reserved successfully',
      reservedSeats: committedSeats,
      totalPrice,
      expiresAt,
      reservationId,
    };
  }

  async allocateSeats(request: SeatAllocationRequest): Promise<void> {
    this.logger.log(`Allocating seats: ${request.seatIds} for order: ${request.orderId}`);

    await this.dataSource.manager.transaction(async (manager: EntityManager) => {
      const seats = await this.queryRepo.findByIdsWithLock(request.seatIds, manager);

      if (seats.length !== request.seatIds.length) {
        throw new NotFoundException('Some seats not found');
      }

      // Validate seats are in RESERVED status
      const invalidSeats = seats.filter((seat) => seat.status !== SeatStatus.RESERVED);
      if (invalidSeats.length > 0) {
        throw new ConflictException('Some seats are not in reserved status');
      }

      const now = new Date();
      seats.forEach((seat) => {
        seat.status = SeatStatus.ALLOCATED;
        seat.orderId = request.orderId;
        seat.reservationExpiresAt = null;
        // keep reservation metadata if needed or clear
        seat.reservedBy = seat.reservedBy ?? null;
        seat.reservedAt = seat.reservedAt ?? null;
        // optional: mark allocation time
        (seat as any).allocatedAt = now;
      });

      await manager.save(seats);
    });

    this.logger.log(`Successfully allocated ${request.seatIds.length} seats for order: ${request.orderId}`);
  }

  async releaseSeats(seatIds: number[]): Promise<void> {
    this.logger.log(`Releasing seats: ${seatIds}`);

    await this.dataSource.manager.transaction(async (manager: EntityManager) => {
      const seats = await this.queryRepo.findByIdsWithLock(seatIds, manager);

      if (!seats || seats.length === 0) {
        this.logger.log(`No seats found to release for ids: ${seatIds}`);
        return;
      }

      seats.forEach((seat) => {
        seat.status = SeatStatus.AVAILABLE;
        seat.reservedBy = null;
        seat.orderId = null;
        seat.reservedAt = null;
        seat.reservationExpiresAt = null;
      });

      await manager.save(seats);
      this.logger.log(`Successfully released ${seats.length} seats`);
    });
  }

  async createSeat(dto: CreateSeatDto): Promise<Seat> {
    this.logger.log(`Creating new seat for event: ${dto.eventId}`);

    const seat = await this.commandRepo.create({
      eventId: dto.eventId,
      seatNumber: dto.seatNumber,
      rowNumber: dto.rowNumber,
      section: dto.section,
      type: dto.type,
      price: dto.price,
      status: SeatStatus.AVAILABLE,
    });

    this.logger.log(`Seat created with ID: ${seat.id}`);
    return seat;
  }

  async blockSeat(id: number): Promise<void> {
    this.logger.log(`Blocking seat: ${id}`);
    const seat = await this.queryRepo.findById(id);
    if (!seat) {
      throw new NotFoundException(`Seat not found with id: ${id}`);
    }
    seat.status = SeatStatus.BLOCKED;
    await this.commandRepo.save(seat);
    this.logger.log(`Seat blocked: ${id}`);
  }

  async unblockSeat(id: number): Promise<void> {
    this.logger.log(`Unblocking seat: ${id}`);
    const seat = await this.queryRepo.findById(id);
    if (!seat) {
      throw new NotFoundException(`Seat not found with id: ${id}`);
    }
    seat.status = SeatStatus.AVAILABLE;
    await this.commandRepo.save(seat);
    this.logger.log(`Seat unblocked: ${id}`);
  }

  // Schedule individual reservation expiry
  private scheduleReservationExpiry(reservationId: string, seatIds: number[]): void {
    setTimeout(async () => {
      try {
        const redisKey = `${this.REDIS_KEY_PREFIX}${reservationId}`;
        const exists = await this.redis.exists(redisKey);

        if (!exists) {
          // Reservation was already confirmed or cancelled
          return;
        }

        // Reservation expired, release seats
        await this.releaseSeats(seatIds);
        await this.redis.del(redisKey);

        this.logger.log(`Expired reservation ${reservationId} released automatically`);
      } catch (error) {
        this.logger.error(`Error releasing expired reservation ${reservationId}:`, error);
      }
    }, this.RESERVATION_TTL_MINUTES * 60 * 1000);
  }

  // Cron job to clean up expired reservations (backup mechanism)
  @Cron(CronExpression.EVERY_MINUTE)
  async releaseExpiredReservations(): Promise<void> {
    this.logger.log('Running scheduled task: Checking for expired reservations');

    try {
      const releasedCount = await this.commandRepo.releaseExpiredReservations();

      if (releasedCount > 0) {
        this.logger.log(`Released ${releasedCount} expired reservations`);
      }
    } catch (error) {
      this.logger.error('Error releasing expired reservations:', error);
    }
  }
}
