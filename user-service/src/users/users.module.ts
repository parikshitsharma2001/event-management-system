import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { UsersController } from './controller/users.controller';
import { UsersService } from './service/users.service';
import { UsersQueryRepository } from './repository/users.query';
import { UsersCommandRepository } from './repository/users.command';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'mySecretKeyForJwtTokenGenerationAndValidationPurposesOnly',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersQueryRepository, UsersCommandRepository],
  exports: [UsersService],
})
export class UsersModule { }