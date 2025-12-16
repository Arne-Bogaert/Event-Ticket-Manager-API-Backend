import { Role } from '../auth/roles';

export interface JwtPayload {
  sub: number;
  email: string;
  role: string[];
}

export interface Session {
  id: number;
  email: string;
  roles: Role[];
}
