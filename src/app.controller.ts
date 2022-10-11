import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getHello(@Request() req): string {
    console.log(req.user);
    return req.user;
  }
}
