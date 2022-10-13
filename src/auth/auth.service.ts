import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { jwtConstants } from './constants';
import { UserNotFoundException } from 'src/users/exception/userNotFound.exception';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async getTokens(data: { name: string; id: number; email: string }) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(data, {
        secret: jwtConstants.jwt_access_secret,
        expiresIn: '1d',
      }),
      this.jwtService.signAsync(data, {
        secret: jwtConstants.jwt_refresh_secret,
        expiresIn: '7d',
      }),
    ]);
    return {
      access_token,
      refresh_token,
    };
  }
  async hashData(data: string) {
    const saltOrRounds = 10;
    return bcrypt.hash(data, saltOrRounds);
  }

  async updateRefreshToken(userId: number, rfToken: string) {
    const hashedRfToken = await this.hashData(rfToken);
    await this.usersService.update(userId, { refresh_token: hashedRfToken });
  }

  async clearRfTokenDB(userId: number) {
    return this.usersService.update(userId, { refresh_token: null });
  }

  async getUserIfRefreshTokenMatches(userId: number, refreshToken: string) {
    const user = await this.usersService.findOneById(userId);
    if (!user || !user.refresh_token)
      throw new ForbiddenException('Access denied.');

    const refreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refresh_token,
    );

    if (!refreshTokenValid) throw new ForbiddenException('Access denied.');

    return user;
  }

  async verifyUserWidthId(userId: number) {
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    return instanceToPlain(user);
  }

  public getCookieForLogOut() {
    return [
      'Authentication=; HttpOnly; Path=/; Max-Age=0',
      'Refresh=; HttpOnly; Path=/; Max-Age=0',
    ];
  }

  public getCookieWithJwtToken(token: string) {
    return `Authentication=${token}; HttpOnly; Path=/; Max-Age=6480`;
  }

  public getCookieWithRfJwtToken(token: string) {
    return `Refresh=${token}; HttpOnly; Path=/; Max-Age=6480`;
  }
}
