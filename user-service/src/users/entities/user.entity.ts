import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  EVENT_ORGANIZER = 'EVENT_ORGANIZER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED'
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id!: number;

  @Column({ name: 'username', type: 'varchar', length: 50, unique: true, nullable: false })
  username!: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true, nullable: false })
  email!: string;

  @Column({ name: 'password', type: 'varchar', length: 255, nullable: false })
  password!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100, nullable: false })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100, nullable: false })
  lastName!: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber!: string | null;

  @Column({ name: 'address', type: 'text', nullable: true })
  address!: string | null;

  @Column({ name: 'city', type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ name: 'state', type: 'varchar', length: 100, nullable: true })
  state!: string | null;

  @Column({ name: 'zip_code', type: 'varchar', length: 20, nullable: true })
  zipCode!: string | null;

  @Column({ name: 'country', type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ name: 'role', type: 'varchar', length: 50, default: UserRole.CUSTOMER })
  role!: UserRole;

  @Column({ name: 'status', type: 'varchar', length: 50, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin!: Date | null;
}