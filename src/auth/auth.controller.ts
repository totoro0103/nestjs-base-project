import {
  Body,
  Controller,
  Injectable,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterUser } from './dto/register-user.dto';
import { instanceToInstance } from 'class-transformer';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
@Injectable()
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Post('/register')
  async register(@Body() registerUserDto: RegisterUser): Promise<User> {
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(
      registerUserDto.password,
      saltOrRounds,
    );

    const user = await this.usersService.create({
      ...registerUserDto,
      password: hashedPassword,
    });

    return instanceToInstance(user);
  }

  @Post('/login')
  @UseGuards(LocalAuthGuard)
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
}
