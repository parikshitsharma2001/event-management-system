import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seat, SeatStatus } from '../entities/seat.entity';
import { In } from 'typeorm';

@Injectable()
export class SeatingCommandRepository {
    constructor(
        @InjectRepository(Seat)
        private readonly repo: Repository<Seat>,
    ) { }

    async create(seat: Partial<Seat>): Promise<Seat> {
        const newSeat = this.repo.create(seat);
        return this.repo.save(newSeat);
    }

    async save(seat: Seat): Promise<Seat> {
        return this.repo.save(seat);
    }

    async saveAll(seats: Seat[]): Promise<Seat[]> {
        return this.repo.save(seats);
    }

    async updateStatus(id: number, status: SeatStatus): Promise<void> {
        await this.repo.update({ id }, { status, updatedAt: new Date() });
    }

    async updateSeatsToAvailable(seatIds: number[]): Promise<void> {
        await this.repo.update(
            { id: In(seatIds) },
            {
                status: SeatStatus.AVAILABLE,
                reservedBy: null,
                orderId: null,
                reservedAt: null,
                reservationExpiresAt: null,
                updatedAt: new Date(),
            },
        );
    }

    async releaseExpiredReservations(): Promise<number> {
        const result = await this.repo
            .createQueryBuilder()
            .update(Seat)
            .set({
                status: SeatStatus.AVAILABLE,
                reservedBy: null,
                reservedAt: null,
                reservationExpiresAt: null,
                updatedAt: new Date(),
            })
            .where('status = :status', { status: SeatStatus.RESERVED })
            .andWhere('reservation_expires_at < :now', { now: new Date() })
            .execute();

        return result.affected || 0;
    }
}
