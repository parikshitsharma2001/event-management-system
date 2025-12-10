import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { Seat, SeatStatus } from '../entities/seat.entity';

@Injectable()
export class SeatingQueryRepository {
    constructor(
        @InjectRepository(Seat)
        private readonly repo: Repository<Seat>,
    ) { }

    async findById(id: number): Promise<Seat | null> {
        return this.repo.findOne({ where: { id } });
    }

    async findByIds(ids: number[]): Promise<Seat[]> {
        return this.repo.find({ where: { id: In(ids) } });
    }

    async findByEventId(eventId: number): Promise<Seat[]> {
        return this.repo.find({ where: { eventId }, order: { rowNumber: 'ASC', seatNumber: 'ASC' } });
    }

    async findByEventIdAndStatus(eventId: number, status: SeatStatus): Promise<Seat[]> {
        return this.repo.find({ where: { eventId, status }, order: { rowNumber: 'ASC', seatNumber: 'ASC' } });
    }

    async findAvailableSeatsByEventId(eventId: number): Promise<Seat[]> {
        return this.repo.find({
            where: { eventId, status: SeatStatus.AVAILABLE },
            order: { rowNumber: 'ASC', seatNumber: 'ASC' },
        });
    }

    async findByOrderId(orderId: string): Promise<Seat[]> {
        return this.repo.find({ where: { orderId } });
    }

    async countByEventIdAndStatus(eventId: number, status: SeatStatus): Promise<number> {
        return this.repo.count({ where: { eventId, status } });
    }

    async findExpiredReservations(): Promise<Seat[]> {
        return this.repo.find({
            where: {
                status: SeatStatus.RESERVED,
                reservationExpiresAt: LessThan(new Date()),
            },
        });
    }

    async findByIdWithLock(id: number): Promise<Seat | null> {
        return this.repo
            .createQueryBuilder('seat')
            .where('seat.id = :id', { id })
            .setLock('pessimistic_write')
            .getOne();
    }

    async findByIdsWithLock(ids: number[]): Promise<Seat[]> {
        return this.repo
            .createQueryBuilder('seat')
            .whereInIds(ids)
            .setLock('pessimistic_write')
            .getMany();
    }
}