import { IsNotEmpty, IsInt, IsString, IsEnum, IsNumber, Min, IsArray, IsOptional } from 'class-validator';
import { SeatStatus, SeatType } from '../entities/seat.entity';

export class CreateSeatDto {
    @IsInt()
    @IsNotEmpty()
    eventId!: number;

    @IsString()
    @IsNotEmpty()
    seatNumber!: string;

    @IsString()
    @IsNotEmpty()
    rowNumber!: string;

    @IsString()
    @IsNotEmpty()
    section!: string;

    @IsEnum(SeatType)
    @IsOptional()
    type?: SeatType;

    @IsNumber()
    @Min(0)
    price!: number;
}

export class SeatReservationRequest {
    @IsInt()
    @IsNotEmpty()
    eventId!: number;

    @IsArray()
    @IsInt({ each: true })
    @IsNotEmpty()
    seatIds!: number[];

    @IsInt()
    @IsNotEmpty()
    userId!: number;

    @IsOptional()
    @IsString()
    orderId?: string;
}

export class SeatAllocationRequest {
    @IsArray()
    @IsInt({ each: true })
    @IsNotEmpty()
    seatIds!: number[];

    @IsString()
    @IsNotEmpty()
    orderId!: string;
}

export class SeatReservationResponse {
    success!: boolean;
    message!: string;
    reservedSeats!: any[];
    totalPrice!: number;
    expiresAt!: Date;
    reservationId!: string;
}

export class SeatAvailabilityResponse {
    eventId!: number;
    totalSeats!: number;
    availableSeats!: number;
    reservedSeats!: number;
    allocatedSeats!: number;
    availableSeatsList!: any[];
    availabilityBySection!: Record<string, number>;
}