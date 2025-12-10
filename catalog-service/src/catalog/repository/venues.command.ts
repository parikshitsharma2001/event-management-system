import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venue } from '../entities/venue';
import { CreateVenueDto } from '../dto/venue.dto';

@Injectable()
export class VenuesCommand {
  constructor(
    @InjectRepository(Venue) private readonly repo: Repository<Venue>,
  ) { }

  async createVenue(data: CreateVenueDto): Promise<Venue> {
    const venue = this.repo.create({
      name: data.name,
      city: data.city,
      address: data.address,
      capacity: data.capacity,
    });
    return this.repo.save(venue);
  }

  async updateVenue(id: number, patch: Partial<Venue>) {
    return this.repo.update(id, patch);
  }

  async deleteVenue(id: number) {
    return this.repo.delete(id);
  }
}
