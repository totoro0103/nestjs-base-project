import { IsEmail, MaxLength, MinLength } from 'class-validator';

export class RegisterUser {
  @IsEmail()
  email: string;

  @MaxLength(16)
  name: string;

  @MinLength(6)
  password: string;
}
