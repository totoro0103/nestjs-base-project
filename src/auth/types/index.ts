import { Request } from 'express';
import { User } from '../../users/entities/user.entity';

export interface JwtPayload {
  id: number;
  name: string;
  email: string;
}

export interface RequestWithUser extends Request {
  user: User;
}
