import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { users } from '../drizzle/schema';
import {
  PublicUserResponseDto,
  UpdateUserDto,
  UserDetailResponseDto,
} from './dto/users.dto';

import { plainToInstance } from 'class-transformer';
import * as drizzleProvider from '../drizzle/drizzle.provider';

@Injectable()
export class UsersService {
  constructor(
    @drizzleProvider.InjectDrizzle()
    private readonly db: drizzleProvider.DatabaseProvider,
  ) {}

  async findAll(): Promise<{ items: PublicUserResponseDto[] }> {
    const rows = await this.db.query.users.findMany();

    return {
      items: rows.map((u) =>
        plainToInstance<PublicUserResponseDto, typeof u>(
          PublicUserResponseDto,
          u,
          {
            excludeExtraneousValues: true,
          },
        ),
      ),
    };
  }

  async findOne(id: number): Promise<UserDetailResponseDto> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
      with: { tickets: { with: { user: true } } },
    });

    if (!user) throw new NotFoundException(`User met id ${id} niet gevonden`);

    return plainToInstance<UserDetailResponseDto, any>(
      UserDetailResponseDto,
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tickets: user.tickets.map((t) => ({
          id: t.id,
          price: Number(t.price),
          type: t.type,
          user: { id: t.user.id, name: t.user.name },
        })),
      },
      { excludeExtraneousValues: true },
    );
  }

  async updateById(
    id: number,
    changes: UpdateUserDto,
  ): Promise<PublicUserResponseDto> {
    if (changes.password) {
      delete changes.password;
    }

    const [result] = await this.db
      .update(users)
      .set(changes)
      .where(eq(users.id, id));

    if (result.affectedRows === 0) {
      throw new NotFoundException('No user with this id exists');
    }

    return this.getById(id);
  }

  async getById(id: number): Promise<PublicUserResponseDto> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) throw new NotFoundException('No user with this id exists');

    return plainToInstance(PublicUserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: number) {
    const [result] = await this.db.delete(users).where(eq(users.id, id));
    if (result.affectedRows === 0)
      throw new NotFoundException(
        `User met id ${id} kon niet worden verwijderd`,
      );
  }
}
