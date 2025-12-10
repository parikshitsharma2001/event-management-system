import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentsController } from './controller/payments';
import { PaymentsService } from './service/payments';
import { PaymentsQueryRepository } from './repository/payments.query';
import { PaymentsCommandRepository } from './repository/payment.command';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsQueryRepository, PaymentsCommandRepository]
})

export class PaymentsModule { }
