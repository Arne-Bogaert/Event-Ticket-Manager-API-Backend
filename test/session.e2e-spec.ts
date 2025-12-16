import { INestApplication } from '@nestjs/common';
import {
  DatabaseProvider,
  DrizzleAsyncProvider,
} from '../src/drizzle/drizzle.provider';
import request from 'supertest';
import { createTestApp } from './helpers/create-app';
import { seedUsers, clearUsers, TEST_USERS } from './seeds/users';

describe('Session (Login)', () => {
  let app: INestApplication;
  let drizzle: DatabaseProvider;

  const url = '/api/sessions';

  beforeAll(async () => {
    app = await createTestApp();
    drizzle = app.get(DrizzleAsyncProvider);

    await clearUsers(drizzle);
    await seedUsers(app, drizzle);
  });

  afterAll(async () => {
    await clearUsers(drizzle);
    await app.close();
  });

  describe('POST /api/sessions', () => {
    it('should return 200 and a JWT token for valid User credentials', async () => {
      const response = await request(app.getHttpServer()).post(url).send({
        email: TEST_USERS.USER.email,
        password: TEST_USERS.USER.password,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');

      expect(response.body.token.split('.').length).toBe(3);
    });

    it('should return 200 and a JWT token for valid Admin credentials', async () => {
      const response = await request(app.getHttpServer()).post(url).send({
        email: TEST_USERS.ADMIN.email,
        password: TEST_USERS.ADMIN.password,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app.getHttpServer()).post(url).send({
        email: TEST_USERS.USER.email,
        password: 'wrong-password',
      });

      expect(response.statusCode).toBe(401);

      expect(response.body.message).toBeDefined();
    });

    it('should return 401 for non-existing email', async () => {
      const response = await request(app.getHttpServer()).post(url).send({
        email: 'does.not.exist@hogent.be',
        password: 'password123',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app.getHttpServer()).post(url).send({
        email: 'invalid-email',
        password: 'password123',
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.details.body).toHaveProperty('email');
    });

    it('should return 400 when password is too short', async () => {
      const response = await request(app.getHttpServer()).post(url).send({
        email: TEST_USERS.USER.email,
        password: '123',
      });

      expect(response.statusCode).toBe(400);
      expect(response.body.details.body).toHaveProperty('password');
    });

    it('should return 400 when body is empty', async () => {
      const response = await request(app.getHttpServer()).post(url).send({});

      expect(response.statusCode).toBe(400);
    });
  });
});
