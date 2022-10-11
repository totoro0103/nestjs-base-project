import {
  Body,
  Controller,
  Injectable,
  Post,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
  Get,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { instanceToInstance } from 'class-transformer';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Controller('auth')
@Injectable()
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Post('/register')
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltOrRounds,
    );

    //find user by name

    const userExists = await this.usersService.findOne({
      email: createUserDto.email,
    });

    if (userExists) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const user = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    const tokens = await this.authService.getTokens(payload);

    await this.authService.updateRefreshToken(user.id, tokens.refreshToken);
    return instanceToInstance(user);
  }

  @Post('/login')
  @UseGuards(LocalAuthGuard)
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Get('/refresh')
  async refresh() {
    return {};
  }
}
