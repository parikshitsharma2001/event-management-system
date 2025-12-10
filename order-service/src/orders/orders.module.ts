import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersQueryRepository } from './repository/orders.query';
import { OrdersCommandRepository } from './repository/orders.command';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Ticket } from './entities/ticket.entity';
import { OrdersController } from './controller/orders';
import { OrdersService } from './service/orders';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Ticket])],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersQueryRepository, OrdersCommandRepository],
})

export class OrdersModule { }
