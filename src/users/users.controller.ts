import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { instanceToPlain } from 'class-transformer';
import { AccessTokenGuard } from 'src/auth/guard/accessToken.guard';
import { RequestWithUser } from 'src/auth/types';
@UseGuards(AccessTokenGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      saltOrRounds,
    );
    return this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  @Get()
  async findAll() {
    return instanceToPlain(await this.usersService.findAll());
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  async getMe(@Request() req: RequestWithUser) {
    return req.user;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
