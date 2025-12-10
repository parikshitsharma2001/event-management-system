import { IsUUID, IsIn, IsNotEmpty, IsString } from 'class-validator';

export class PaymentCallbackDto {
    @IsUUID('4', { message: 'order_id must be a valid UUID' })
    @IsNotEmpty()
    order_id!: string;

    @IsUUID('4', { message: 'payment_id must be a valid UUID' })
    @IsNotEmpty()
    payment_id!: string;

    @IsString()
    @IsIn(['SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'], {
        message: 'status must be one of SUCCESS, FAILED, CANCELLED, REFUNDED',
    })
    status!: string;
}
