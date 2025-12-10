import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsModule } from './payments/payments.module';
import { DataSourceOptions } from 'typeorm';
import { Payment } from './payments/entities/payment.entity';
import { initDb } from './config/database';

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
          entities: [Payment],
          synchronize: true,
          logging: false,
        } as DataSourceOptions;
      },
    }),
    PaymentsModule,
  ],
})

export class AppModule { }
