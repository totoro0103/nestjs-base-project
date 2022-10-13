import {
  Body,
  Controller,
  Injectable,
  Post,
  UseGuards,
  Get,
  BadRequestException,
  Req,
  Res,
} from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { instanceToInstance } from 'class-transformer';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserExistException } from 'src/users/exception/userNotExist.exception';
import { UserNotExistException } from 'src/users/exception/userExists.exception';
import { AuthDto } from './dto/auth.dto';
import { AccessTokenGuard } from './guard/accessToken.guard';
import { Request, Response } from 'express';
import { RefreshTokenGuard } from './guard/refreshToken.guard';
import { request } from 'http';
import { RequestWithUser } from './types';

@Controller('auth')
@Injectable()
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltOrRounds,
    );

    const userExists = await this.usersService.findOne({
      email: createUserDto.email,
    });

    if (userExists) {
      throw new UserExistException();
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

    await this.authService.updateRefreshToken(user.id, tokens.refresh_token);
    return instanceToInstance(user);
  }

  @Post('login')
  async login(
    @Body() authData: AuthDto,
    @Res({ passthrough: true }) resp: Response,
  ) {
    const user = await this.usersService.findOne({ email: authData.email });
    if (!user) {
      throw new UserNotExistException();
    }

    const passwordValid = await bcrypt.compare(
      authData.password,
      user.password,
    );
    if (!passwordValid) {
      throw new BadRequestException('Password is incorrect.');
    }

    const tokens = await this.authService.getTokens({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    const accessTokenCookie = this.authService.getCookieWithJwtToken(
      tokens.access_token,
    );
    const rfTokenCookie = this.authService.getCookieWithRfJwtToken(
      tokens.refresh_token,
    );

    resp.setHeader('Set-Cookie', [accessTokenCookie, rfTokenCookie]);

    await this.authService.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  @UseGuards(RefreshTokenGuard)
  @Get('refresh-token')
  async refresh(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) resp: Response,
  ) {
    const user = req.user;

    const tokens = await this.authService.getTokens({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    const accessTokenCookie = this.authService.getCookieWithJwtToken(
      tokens.access_token,
    );

    resp.setHeader('Set-Cookie', accessTokenCookie);

    return { access_token: tokens.access_token };
  }

  @UseGuards(AccessTokenGuard)
  @Get('logout')
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) resp: Response,
  ) {
    await this.authService.clearRfTokenDB(req.user.id);
    resp.setHeader('Set-Cookie', this.authService.getCookieForLogOut());
    return { data: 'logout successfully' };
  }
}
