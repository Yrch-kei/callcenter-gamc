import { Request } from 'express';
import { Role } from '../models/role.entity';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        unitId?: number | null;
      };
    }
  }
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  unitId?: number | null;
  iat?: number;
  exp?: number;
}