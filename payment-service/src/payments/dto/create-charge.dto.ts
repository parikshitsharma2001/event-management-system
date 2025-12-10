import { IsUUID, IsInt, Min, IsOptional, IsString } from 'class-validator';

export class CreateChargeAPIDto {
  @IsUUID()
  merchant_order_id!: string;

  @IsInt()
  @Min(1)
  amount_cents!: number;

  @IsOptional()
  @IsString()
  currency?: string;
}

export class CreateChargeDBDto {
  merchantOrderId!: string;
  idempotencyKey!: string;
  amountCents!: number;
  currency?: string;
}
