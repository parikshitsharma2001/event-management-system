import { Injectable, Logger, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersQueryRepository } from '../repository/users.query';
import { UsersCommandRepository } from '../repository/users.command';
import { AuthResponseDto, LoginDto, UpdateUserDto, UserRegistrationDto, UserResponseDto } from '../dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { User, UserStatus } from '../entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly queryRepo: UsersQueryRepository,
    private readonly commandRepo: UsersCommandRepository,
    private readonly jwtService: JwtService,
  ) { }

  async registerUser(dto: UserRegistrationDto): Promise<AuthResponseDto> {
    this.logger.log(`Registering new user: ${dto.username}`);

    const existingByUsername = await this.queryRepo.findByUsername(dto.username);
    if (existingByUsername) {
      throw new ConflictException(`Username already exists: ${dto.username}`);
    }

    const existingByEmail = await this.queryRepo.findByEmail(dto.email);
    if (existingByEmail) {
      throw new ConflictException(`Email already exists: ${dto.email}`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.commandRepo.createUser({
      ...dto,
      password: hashedPassword,
    });

    this.logger.log(`User registered successfully: ${user.id}`);

    const token = this.generateToken(user.username);
    return {
      token,
      tokenType: 'Bearer',
      user: this.toResponseDto(user),
    };
  }

  async authenticateUser(dto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Authenticating user: ${dto.usernameOrEmail}`);

    const user = await this.queryRepo.findByUsernameOrEmail(dto.usernameOrEmail);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active');
    }

    await this.commandRepo.updateLastLogin(user.id);

    this.logger.log(`User authenticated successfully: ${user.id}`);

    const token = this.generateToken(user.username);
    return {
      token,
      tokenType: 'Bearer',
      user: this.toResponseDto(user),
    };
  }

  async getUserById(id: number): Promise<UserResponseDto> {
    this.logger.log(`Fetching user by ID: ${id}`);
    const user = await this.queryRepo.findById(id);
    if (!user) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }
    return this.toResponseDto(user);
  }

  async getUserByUsername(username: string): Promise<UserResponseDto> {
    this.logger.log(`Fetching user by username: ${username}`);
    const user = await this.queryRepo.findByUsername(username);
    if (!user) {
      throw new NotFoundException(`User not found with username: ${username}`);
    }
    return this.toResponseDto(user);
  }

  async getUserByEmail(email: string): Promise<UserResponseDto> {
    this.logger.log(`Fetching user by email: ${email}`);
    const user = await this.queryRepo.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User not found with email: ${email}`);
    }
    return this.toResponseDto(user);
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    this.logger.log('Fetching all users');
    const users = await this.queryRepo.findAll();
    return users.map(user => this.toResponseDto(user));
  }

  async getActiveUsers(): Promise<UserResponseDto[]> {
    this.logger.log('Fetching active users');
    const users = await this.queryRepo.findByStatus(UserStatus.ACTIVE);
    return users.map(user => this.toResponseDto(user));
  }

  async searchUsers(searchTerm: string): Promise<UserResponseDto[]> {
    this.logger.log(`Searching users with term: ${searchTerm}`);
    const users = await this.queryRepo.searchActiveUsers(searchTerm);
    return users.map(user => this.toResponseDto(user));
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<UserResponseDto> {
    this.logger.log(`Updating user: ${id}`);

    const user = await this.queryRepo.findById(id);
    if (!user) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }

    if (dto.email && dto.email !== user.email) {
      const existingByEmail = await this.queryRepo.findByEmail(dto.email);
      if (existingByEmail) {
        throw new ConflictException(`Email already exists: ${dto.email}`);
      }
    }

    const updated = await this.commandRepo.updateUser(id, dto);
    if (!updated) {
      throw new NotFoundException(`User not found after update`);
    }

    this.logger.log(`User updated successfully: ${updated.id}`);
    return this.toResponseDto(updated);
  }

  async deleteUser(id: number): Promise<void> {
    this.logger.log(`Deleting user: ${id}`);

    const user = await this.queryRepo.findById(id);
    if (!user) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }

    await this.commandRepo.updateStatus(id, UserStatus.DELETED);
    this.logger.log(`User deleted successfully: ${id}`);
  }

  async suspendUser(id: number): Promise<void> {
    this.logger.log(`Suspending user: ${id}`);

    const user = await this.queryRepo.findById(id);
    if (!user) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }

    await this.commandRepo.updateStatus(id, UserStatus.SUSPENDED);
    this.logger.log(`User suspended successfully: ${id}`);
  }

  async activateUser(id: number): Promise<void> {
    this.logger.log(`Activating user: ${id}`);

    const user = await this.queryRepo.findById(id);
    if (!user) {
      throw new NotFoundException(`User not found with id: ${id}`);
    }

    await this.commandRepo.updateStatus(id, UserStatus.ACTIVE);
    this.logger.log(`User activated successfully: ${id}`);
  }

  private generateToken(username: string): string {
    return this.jwtService.sign({ username });
  }

  private toResponseDto(user: User): UserResponseDto {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponseDto;
  }
}