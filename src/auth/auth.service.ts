import { Injectable, NotAcceptableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async getTokens(data: { name: string; id: number; email: string }) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(data, {
        secret: jwtConstants.jwt_access_secret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(data, {
        secret: jwtConstants.jwt_refresh_secret,
        expiresIn: '7d',
      }),
    ]);
    return {
      accessToken,
      refreshToken,
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

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOne({ email });
    if (!user) {
      throw new NotAcceptableException('User not found.');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (user && passwordValid) {
      return user;
    }

    return null;
  }

  async login(user: any): Promise<any> {
    const payload = { name: user.name, id: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
