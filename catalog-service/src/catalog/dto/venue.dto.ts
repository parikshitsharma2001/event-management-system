import { IsString, IsOptional, IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVenueDto {
  @IsString()
  name!: string;

  @IsString()
  city!: string;

  @IsString()
  address!: string;

  @IsNumber()
  capacity!: number;
}

export class CreateVenueAPIDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  capacity?: number;
}
