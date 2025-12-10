import { IsUUID } from 'class-validator';

export class RefundDto {
  @IsUUID()
  payment_id!: string;
}
