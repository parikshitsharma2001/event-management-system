import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User, UserStatus } from '../entities/user.entity';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) { }

  async findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.repo.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findByUsernameOrEmail(usernameOrEmail: string): Promise<User | null> {
    return this.repo.createQueryBuilder('user')
      .where('user.username = :usernameOrEmail', { usernameOrEmail })
      .orWhere('user.email = :usernameOrEmail', { usernameOrEmail })
      .getOne();
  }

  async findAll(): Promise<User[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findByStatus(status: UserStatus): Promise<User[]> {
    return this.repo.find({ where: { status }, order: { createdAt: 'DESC' } });
  }

  async searchActiveUsers(searchTerm: string): Promise<User[]> {
    return this.repo.createQueryBuilder('user')
      .where('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere(
        '(LOWER(user.first_name) LIKE LOWER(:searchTerm) OR ' +
        'LOWER(user.last_name) LIKE LOWER(:searchTerm) OR ' +
        'LOWER(user.email) LIKE LOWER(:searchTerm))',
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }
}