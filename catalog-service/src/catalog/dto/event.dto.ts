import { IsString, IsInt, IsOptional, IsDate, IsIn, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDto {
    @IsInt()
    venue_id!: number;

    @IsString()
    title!: string;

    @IsOptional()
    @IsString()
    type?: string;

    @Type(() => Date)
    @IsDate()
    start_time!: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    end_time?: Date;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class EventsFilterDto {
    city?: string;
    type?: string;
    status?: string
}

export class CreateEventAPIDto {
    @IsInt()
    @Type(() => Number)
    venue_id!: number;

    @IsString()
    title!: string;

    @IsOptional()
    @IsString()
    type?: string;

    @Type(() => Date)
    @IsDate()
    start_time!: Date;

    @ValidateIf((o) => o.end_time !== undefined)
    @Type(() => Date)
    @IsDate()
    end_time?: Date;

    @IsOptional()
    @IsString()
    @IsIn(['ON_SALE', 'SOLD_OUT', 'CANCELLED'], {
        message: 'status must be one of ON_SALE, SOLD_OUT, CANCELLED',
    })
    status?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class ListEventsQueryDto {
    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    status?: string;
}
