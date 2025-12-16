import { INestApplication } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import { DatabaseProvider } from '../../src/drizzle/drizzle.provider';
import { users } from '../../src/drizzle/schema';
import { Role } from '../../src/auth/roles';

export const TEST_USERS = {
  USER: {
    id: 1,
    email: 'test.user@hogent.be',
    password: '12345678',
    name: 'Test User',
    role: Role.USER,
  },
  ADMIN: {
    id: 2,
    email: 'admin.user@hogent.be',
    password: '12345678',
    name: 'Admin User',
    role: Role.ADMIN,
  },
};

export const USERS_EXPECTED_DTO = [
  {
    id: 1,
    name: 'Test User',
    email: 'test.user@hogent.be',
  },
  {
    id: 2,
    name: 'Admin User',
    email: 'admin.user@hogent.be',
  },
];

export async function seedUsers(
  app: INestApplication,
  drizzle: DatabaseProvider,
) {
  const authService = app.get(AuthService);
  const passwordHash = await authService.hashPassword(TEST_USERS.USER.password);

  await drizzle.insert(users).values([
    {
      id: TEST_USERS.USER.id,
      name: TEST_USERS.USER.name,
      email: TEST_USERS.USER.email,
      password: passwordHash,
      role: TEST_USERS.USER.role,
    },
    {
      id: TEST_USERS.ADMIN.id,
      name: TEST_USERS.ADMIN.name,
      email: TEST_USERS.ADMIN.email,
      password: passwordHash,
      role: TEST_USERS.ADMIN.role,
    },
  ]);
}

export async function clearUsers(drizzle: DatabaseProvider) {
  await drizzle.delete(users);
}
