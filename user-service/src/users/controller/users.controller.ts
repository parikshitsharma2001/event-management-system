import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { UsersService } from '../service/users.service';
import { AuthResponseDto, LoginDto, UpdateUserDto, UserRegistrationDto, UserResponseDto } from '../dto/user.dto';
import * as client from 'prom-client';

// --- PROMETHEUS SETUP --- //
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const userRegistrationsTotal = new client.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
});

const userLoginsTotal = new client.Counter({
  name: 'user_logins_total',
  help: 'Total number of user logins',
});

register.registerMetric(userRegistrationsTotal);
register.registerMetric(userLoginsTotal);

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('health')
  health() {
    return { ok: true, service: 'user-service' };
  }

  @Get('actuator/health')
  actuatorHealth() {
    return { status: 'UP', service: 'user-service' };
  }

  @Get('actuator/prometheus')
  async getMetrics(@Res() res: Response) {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  }

  @Post('v1/users/register')
  async register(@Body() body: UserRegistrationDto, @Res() res: Response) {
    const result = await this.usersService.registerUser(body);
    userRegistrationsTotal.inc();
    return res.status(201).json(result);
  }

  @Post('v1/users/login')
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const result = await this.usersService.authenticateUser(body);
    userLoginsTotal.inc();
    return res.json(result);
  }

  @Get('v1/users/:id')
  async getUserById(@Param('id') id: string, @Res() res: Response) {
    const user = await this.usersService.getUserById(parseInt(id));
    return res.json(user);
  }

  @Get('v1/users/username/:username')
  async getUserByUsername(@Param('username') username: string, @Res() res: Response) {
    const user = await this.usersService.getUserByUsername(username);
    return res.json(user);
  }

  @Get('v1/users/email/:email')
  async getUserByEmail(@Param('email') email: string, @Res() res: Response) {
    const user = await this.usersService.getUserByEmail(email);
    return res.json(user);
  }

  @Get('v1/users')
  async getAllUsers(
    @Query('search') search: string,
    @Query('activeOnly') activeOnly: string,
    @Res() res: Response
  ) {
    let users: UserResponseDto[];

    if (search) {
      users = await this.usersService.searchUsers(search);
    } else if (activeOnly === 'true') {
      users = await this.usersService.getActiveUsers();
    } else {
      users = await this.usersService.getAllUsers();
    }

    return res.json(users);
  }

  @Put('v1/users/:id')
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto, @Res() res: Response) {
    const user = await this.usersService.updateUser(parseInt(id), body);
    return res.json(user);
  }

  @Delete('v1/users/:id')
  async deleteUser(@Param('id') id: string, @Res() res: Response) {
    await this.usersService.deleteUser(parseInt(id));
    return res.status(204).send();
  }

  @Patch('v1/users/:id/suspend')
  async suspendUser(@Param('id') id: string, @Res() res: Response) {
    await this.usersService.suspendUser(parseInt(id));
    return res.json({ message: 'User suspended successfully' });
  }

  @Patch('v1/users/:id/activate')
  async activateUser(@Param('id') id: string, @Res() res: Response) {
    await this.usersService.activateUser(parseInt(id));
    return res.json({ message: 'User activated successfully' });
  }
}