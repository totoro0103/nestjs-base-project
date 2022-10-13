import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { AccessTokenGuard } from './auth/guard/accessToken.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('profile')
  @UseGuards(AccessTokenGuard)
  getHello(@Request() req): string {
    return req.user;
  }
}
