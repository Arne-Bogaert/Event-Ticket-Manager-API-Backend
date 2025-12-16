import { INestApplication } from '@nestjs/common';
import {
  DatabaseProvider,
  DrizzleAsyncProvider,
} from '../src/drizzle/drizzle.provider';
import request from 'supertest';
import { createTestApp } from './helpers/create-app';
import {
  seedCategories,
  clearCategories,
  CATEGORIES_EXPECTED_DTO,
} from './seeds/categories';
import { clearUsers, seedUsers } from './seeds/users';
import { login, loginAdmin } from './helpers/login';
import testAuthHeader from './helpers/testAuthHeader';

const NEW_CATEGORY_DATA = {
  name: 'Theater',
};

describe('Categories', () => {
  let app: INestApplication;
  let drizzle: DatabaseProvider;
  let userAuthToken: string;
  let adminAuthToken: string;

  const url = '/api/categories';

  beforeAll(async () => {
    app = await createTestApp();
    drizzle = app.get(DrizzleAsyncProvider);

    await clearCategories(drizzle);
    await clearUsers(drizzle);

    await seedCategories(drizzle);
    await seedUsers(app, drizzle);

    userAuthToken = await login(app);
    adminAuthToken = await loginAdmin(app);
  });

  afterAll(async () => {
    await clearCategories(drizzle);
    await clearUsers(drizzle);
    await app.close();
  });

  describe('GET /api/categories', () => {
    it('should return 200 and all seeded categories (public access)', async () => {
      const response = await request(app.getHttpServer()).get(url);
      expect(response.statusCode).toBe(200);
      expect(response.body.items).toEqual(
        expect.arrayContaining(CATEGORIES_EXPECTED_DTO),
      );
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should 200 and return the requested category', async () => {
      const expectedCategory = CATEGORIES_EXPECTED_DTO[0];
      const response = await request(app.getHttpServer()).get(`${url}/1`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(expectedCategory);
    });

    it('should 404 when requesting a non-existing category', async () => {
      const response = await request(app.getHttpServer()).get(`${url}/999`);
      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/categories', () => {
    it('should return 201 and the created category as Admin', async () => {
      const response = await request(app.getHttpServer())
        .post(url)
        .auth(adminAuthToken, { type: 'bearer' })
        .send(NEW_CATEGORY_DATA);

      expect(response.statusCode).toBe(201);
      expect(response.body).toMatchObject({
        ...NEW_CATEGORY_DATA,
        id: expect.any(Number),
      });
    });

    it('should return 403 Forbidden as regular user', async () => {
      const response = await request(app.getHttpServer())
        .post(url)
        .auth(userAuthToken, { type: 'bearer' })
        .send(NEW_CATEGORY_DATA);

      expect(response.statusCode).toBe(403);
    });

    testAuthHeader(() =>
      request(app.getHttpServer()).post(url).send(NEW_CATEGORY_DATA),
    );
  });

  describe('PUT /api/categories/:id', () => {
    it('should 200 and return the updated category as Admin', async () => {
      const response = await request(app.getHttpServer())
        .put(`${url}/1`)
        .send({ name: 'Updated Concert' })
        .auth(adminAuthToken, { type: 'bearer' });

      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('Updated Concert');
    });

    testAuthHeader(() =>
      request(app.getHttpServer()).put(`${url}/1`).send({ name: 'Update' }),
    );
  });

  describe('DELETE /api/categories/:id', () => {
    it('should 204 and return nothing as Admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${url}/1`)
        .auth(adminAuthToken, { type: 'bearer' });

      expect(response.statusCode).toBe(204);
    });

    it('should 404 with non-existing id', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${url}/999`)
        .auth(adminAuthToken, { type: 'bearer' });

      expect(response.statusCode).toBe(404);
    });

    testAuthHeader(() => request(app.getHttpServer()).delete(`${url}/1`));
  });
});
