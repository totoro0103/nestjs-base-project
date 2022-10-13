import { HttpException, HttpStatus } from '@nestjs/common';

export class UserNotExistException extends HttpException {
  constructor() {
    super(`User does not exist`, HttpStatus.BAD_REQUEST);
  }
}
