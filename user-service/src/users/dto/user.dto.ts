import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '../entities/user.entity';

export class UserRegistrationDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    username!: string;

    @IsNotEmpty()
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    password!: string;

    @IsNotEmpty()
    @IsString()
    firstName!: string;

    @IsNotEmpty()
    @IsString()
    lastName!: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    zipCode?: string;

    @IsOptional()
    @IsString()
    country?: string;
}

export class LoginDto {
    @IsNotEmpty()
    @IsString()
    usernameOrEmail!: string;

    @IsNotEmpty()
    @IsString()
    password!: string;
}

export class UpdateUserDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    zipCode?: string;

    @IsOptional()
    @IsString()
    country?: string;
}

export class UserResponseDto {
    id!: number;
    username!: string;
    email!: string;
    firstName!: string;
    lastName!: string;
    phoneNumber?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
    role!: UserRole;
    status!: UserStatus;
    createdAt!: Date;
    updatedAt!: Date;
    lastLogin?: Date | null;
}

export class AuthResponseDto {
    token!: string;
    tokenType: string = 'Bearer';
    user!: UserResponseDto;
}