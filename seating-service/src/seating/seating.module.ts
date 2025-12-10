import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seat } from './entities/seat.entity';
import { SeatingController } from './controller/seating.controller';
import { SeatingService } from './service/seating.service';
import { SeatingQueryRepository } from './repository/seating.query';
import { SeatingCommandRepository } from './repository/seating.command';

@Module({
  imports: [TypeOrmModule.forFeature([Seat])],
  controllers: [SeatingController],
  providers: [SeatingService, SeatingQueryRepository, SeatingCommandRepository],
  exports: [SeatingService],
})
export class SeatingModule { }