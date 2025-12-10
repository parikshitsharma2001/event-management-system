import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { Ticket } from './orders/entities/ticket.entity';
import { initDb } from './config/database';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async (): Promise<DataSourceOptions> => {
        await initDb();

        return {
          type: 'postgres',
          host: process.env.DATABASE_HOST,
          port: parseInt(process.env.DATABASE_PORT!),
          username: process.env.DATABASE_USERNAME,
          password: process.env.DATABASE_PASSWORD,
          database: process.env.DATABASE_NAME,
          entities: [Order, OrderItem, Ticket],
          synchronize: true,
          logging: false,
        } as DataSourceOptions;
      },
    }),
    OrdersModule,
  ],
})

export class AppModule { }
