import {
  IsArray,
  ArrayNotEmpty,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @IsNumber({}, { message: 'user_id must be a number' })
  @Min(1, { message: 'user_id must be at least 1' })
  user_id!: number;

  @IsNumber({}, { message: 'event_id must be a number' })
  event_id!: number;

  @IsArray({ message: 'seats must be an array' })
  @ArrayNotEmpty({ message: 'seats cannot be empty' })
  seats!: number[];
}
