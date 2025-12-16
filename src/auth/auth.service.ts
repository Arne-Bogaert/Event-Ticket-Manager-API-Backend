import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  type DatabaseProvider,
  InjectDrizzle,
} from '../drizzle/drizzle.provider';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthConfig, ServerConfig } from '../config/configuration';
import * as argon2 from 'argon2';
import { user } from '../types/user';
import { JwtPayload } from '../types/auth';
import { LoginRequestDto } from '../session/session.dto';
import { eq } from 'drizzle-orm';
import { users } from '../drizzle/schema';
import { RegisterUserRequestDto } from '../users/dto/users.dto';
import { Role } from './roles';

@Injectable()
export class AuthService {
  constructor(
    @InjectDrizzle()
    private readonly db: DatabaseProvider,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<ServerConfig>,
  ) {}

  // Hash het wachtwoord
  async hashPassword(password: string): Promise<string> {
    const authConfig = this.configService.get<AuthConfig>('auth')!;
    return await argon2.hash(password, {
      type: argon2.argon2id,
      hashLength: authConfig.hashLength,
      timeCost: authConfig.timeCost,
      memoryCost: authConfig.memoryCost,
    });
  }

  // Verifieer een wachtwoord tegen een hash
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await argon2.verify(hash, password);
  }

  // JWT ondertekenen
  private signJWT(user: user): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async verifyJwt(token: string): Promise<JwtPayload> {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    return payload;
  }

  async login({ email, password }: LoginRequestDto): Promise<string> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw new UnauthorizedException(
        'The given email and password do not match',
      );
    }

    const passwordValid = await this.verifyPassword(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException(
        'The given email and password do not match',
      );
    }

    return this.signJWT(user);
  }

  async register({
    name,
    email,
    password,
  }: RegisterUserRequestDto): Promise<string> {
    // 1. Wachtwoord hashen
    const passwordHash = await this.hashPassword(password);

    // 2. Gebruiker aanmaken in DB
    const [newUser] = await this.db
      .insert(users)
      .values({
        name,
        email,
        password: passwordHash,
        role: Role.USER,
      })
      .$returningId();

    // 3. Volledige user ophalen
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, newUser.id),
    });

    // 4. JWT genereren
    return this.signJWT(user!);
  }
}
