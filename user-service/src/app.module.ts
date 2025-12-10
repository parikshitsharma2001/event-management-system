import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { DataSourceOptions } from 'typeorm';
import { User } from './users/entities/user.entity';
import { initDb } from './config/database';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async (): Promise<DataSourceOptions> => {
        await initDb();

        return {
          type: 'postgres',
          host: process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT || '5432'),
          username: process.env.DATABASE_USERNAME || 'postgres',
          password: process.env.DATABASE_PASSWORD || 'postgres',
          database: process.env.DATABASE_NAME || 'userdb',
          entities: [User],
          synchronize: true,
          logging: false,
        } as DataSourceOptions;
      },
    }),
    UsersModule,
  ],
})
export class AppModule { }