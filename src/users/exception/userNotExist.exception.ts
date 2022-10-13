import { HttpException, HttpStatus } from '@nestjs/common';

export class UserExistException extends HttpException {
  constructor() {
    super(`User already exists`, HttpStatus.BAD_REQUEST);
  }
}
