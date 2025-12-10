import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venue } from '../entities/venue';

@Injectable()
export class VenuesQuery {
  constructor(
    @InjectRepository(Venue) private readonly repo: Repository<Venue>,
  ) { }

  async findById(id: number): Promise<Venue | null> {
    return this.repo.findOneBy({ id: Number(id) });
  }

  async findAll(): Promise<Venue[]> {
    return this.repo.find();
  }

  async findByCity(city: string): Promise<Venue[]> {
    return this.repo.find({ where: { city } });
  }
}
