import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../entities/user.entity';
import { UserRegistrationDto, UpdateUserDto } from '../dto/user.dto';

@Injectable()
export class UsersCommandRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) { }

  async createUser(dto: UserRegistrationDto & { password: string }): Promise<User> {
    const user = this.repo.create({
      username: dto.username,
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.phoneNumber || null,
      address: dto.address || null,
      city: dto.city || null,
      state: dto.state || null,
      zipCode: dto.zipCode || null,
      country: dto.country || null,
      status: UserStatus.ACTIVE,
    });
    return this.repo.save(user);
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<User | null> {
    const updateData: any = {};

    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phoneNumber !== undefined) updateData.phoneNumber = dto.phoneNumber;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.zipCode !== undefined) updateData.zipCode = dto.zipCode;
    if (dto.country !== undefined) updateData.country = dto.country;

    await this.repo.update({ id }, { ...updateData, updatedAt: new Date() });
    return this.repo.findOne({ where: { id } });
  }

  async updateStatus(id: number, status: UserStatus): Promise<void> {
    await this.repo.update({ id }, { status, updatedAt: new Date() });
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.repo.update({ id }, { lastLogin: new Date(), updatedAt: new Date() });
  }
}