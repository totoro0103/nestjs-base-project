import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenStrategy } from './strategies/accessToken.strategy';
import { RefreshTokenStrategy } from './strategies/refreshToken.strategy';

@Module({
  controllers: [AuthController],
  imports: [UsersModule, PassportModule, JwtModule.register({})],
  providers: [AuthService, RefreshTokenStrategy, AccessTokenStrategy],
  exports: [AuthService],
})
export class AuthModule {}
