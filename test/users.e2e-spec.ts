import { INestApplication } from '@nestjs/common';
import {
  DatabaseProvider,
  DrizzleAsyncProvider,
} from '../src/drizzle/drizzle.provider';
import request from 'supertest';
import { createTestApp } from './helpers/create-app';
import {
  seedUsers,
  clearUsers,
  USERS_EXPECTED_DTO,
  TEST_USERS,
} from './seeds/users';
import { login, loginAdmin } from './helpers/login';
import testAuthHeader from './helpers/testAuthHeader';
import { Role } from '../src/auth/roles';

const NEW_USER_DATA = {
  name: 'Nieuwe User',
  email: 'nieuw@test.be',
  password: 'password123',
};

describe('Users', () => {
  let app: INestApplication;
  let drizzle: DatabaseProvider;
  let userAuthToken: string;
  let adminAuthToken: string;

  const url = '/api/users';

  beforeAll(async () => {
    app = await createTestApp();
    drizzle = app.get(DrizzleAsyncProvider);

    await clearUsers(drizzle);
    await seedUsers(app, drizzle);

    userAuthToken = await login(app);
    adminAuthToken = await loginAdmin(app);
  });

  afterAll(async () => {
    await clearUsers(drizzle);
    await app.close();
  });

  describe('GET /api/users', () => {
    it('should return 200 and all users for Admin', async () => {
      const response = await request(app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${adminAuthToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.items).toEqual(
        expect.arrayContaining(USERS_EXPECTED_DTO),
      );
    });

    it('should return 403 Forbidden for normal User', async () => {
      const response = await request(app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${userAuthToken}`);

      expect(response.statusCode).toBe(403);
    });

    testAuthHeader(() => request(app.getHttpServer()).get(url));
  });

  describe('GET /api/users/:id', () => {
    it('should return own profile details for User (using "me")', async () => {
      const response = await request(app.getHttpServer())
        .get(`${url}/me`)
        .set('Authorization', `Bearer ${userAuthToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({
        id: TEST_USERS.USER.id,
        email: TEST_USERS.USER.email,
        role: Role.USER,
        tickets: [],
      });
    });

    it('should return user details for Admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`${url}/${TEST_USERS.USER.id}`)
        .set('Authorization', `Bearer ${adminAuthToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.email).toBe(TEST_USERS.USER.email);
    });

    it('should return 404 for non-existing user', async () => {
      const response = await request(app.getHttpServer())
        .get(`${url}/999`)
        .set('Authorization', `Bearer ${adminAuthToken}`);

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 (NotFound) when User requests another user profile', async () => {
      const response = await request(app.getHttpServer())
        .get(`${url}/${TEST_USERS.ADMIN.id}`)
        .set('Authorization', `Bearer ${userAuthToken}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('No user with this id exists');
    });
  });

  describe('POST /api/users (Register)', () => {
    it('should register a new user and return token', async () => {
      const response = await request(app.getHttpServer())
        .post(url)
        .send(NEW_USER_DATA);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('token');
    });

    it('should fail (400) with missing data', async () => {
      const response = await request(app.getHttpServer())
        .post(url)
        .send({ email: 'incomplete@test.be' });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update own user name', async () => {
      const response = await request(app.getHttpServer())
        .patch(`${url}/me`)
        .set('Authorization', `Bearer ${userAuthToken}`)
        .send({ name: 'Updated Name' });

      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.id).toBe(TEST_USERS.USER.id);
    });

    it('should return 404 when User tries to update another user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`${url}/${TEST_USERS.ADMIN.id}`)
        .set('Authorization', `Bearer ${userAuthToken}`)
        .send({ name: 'Hacked Name' });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let tempUserId: number;
    let tempUserToken: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer()).post(url).send({
        name: 'To Delete',
        email: 'delete@me.com',
        password: 'password123',
      });
      tempUserToken = res.body.token;

      const meRes = await request(app.getHttpServer())
        .get(`${url}/me`)
        .set('Authorization', `Bearer ${tempUserToken}`);
      tempUserId = meRes.body.id;
    });

    it('should allow user to delete own account', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${url}/me`)
        .set('Authorization', `Bearer ${tempUserToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.message).toContain('succesvol verwijderd');
    });

    it('should allow Admin to delete a user', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${url}/${tempUserId}`)
        .set('Authorization', `Bearer ${adminAuthToken}`);

      expect(response.statusCode).toBe(200);
    });

    it('should return 404 when User tries to delete another user', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${url}/${TEST_USERS.ADMIN.id}`)
        .set('Authorization', `Bearer ${userAuthToken}`);

      expect(response.statusCode).toBe(404);
    });
  });
});
