import { INestApplication } from '@nestjs/common';
import {
  DatabaseProvider,
  DrizzleAsyncProvider,
} from '../src/drizzle/drizzle.provider';
import request from 'supertest';
import { createTestApp } from './helpers/create-app';
import { seedLocations, clearLocations } from './seeds/locations';
import { seedCategories, clearCategories } from './seeds/categories';
import { seedEvents, clearEvents } from './seeds/events';
import { clearUsers, seedUsers } from './seeds/users';
import { loginAdmin, login } from './helpers/login';
import testAuthHeader from './helpers/testAuthHeader';

const NEW_EVENT_DATA = {
  name: 'Pukkelpop',
  date: '2027-08-15',
  startTime: '11:00:00',
  endTime: '23:00:00',
  locationId: 1,
  categoryIds: [1, 2],
};

describe('Events', () => {
  let app: INestApplication;
  let drizzle: DatabaseProvider;
  let userAuthToken: string;
  let adminAuthToken: string;

  const url = '/api/events';

  beforeAll(async () => {
    app = await createTestApp();
    drizzle = app.get(DrizzleAsyncProvider);

    await clearEvents(drizzle);
    await clearLocations(drizzle);
    await clearCategories(drizzle);
    await clearUsers(drizzle);

    await seedLocations(drizzle);
    await seedCategories(drizzle);
    await seedUsers(app, drizzle);
    await seedEvents(drizzle);

    userAuthToken = await login(app);
    adminAuthToken = await loginAdmin(app);
  });

  afterAll(async () => {
    await clearEvents(drizzle);
    await clearLocations(drizzle);
    await clearCategories(drizzle);
    await clearUsers(drizzle);
    await app.close();
  });

  describe('GET /api/events', () => {
    it('should return 200 and all events', async () => {
      const response = await request(app.getHttpServer()).get(url);
      expect(response.statusCode).toBe(200);
      expect(response.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 1, name: 'Rock Werchter' }),
          expect.objectContaining({ id: 2, name: 'I Love Techno' }),
        ]),
      );
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return 200 and the event detail', async () => {
      const response = await request(app.getHttpServer()).get(`${url}/1`);
      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        name: 'Rock Werchter',
        location: expect.objectContaining({ id: 1 }),
      });
    });

    it('should return 404 for non-existing event', async () => {
      const response = await request(app.getHttpServer()).get(`${url}/999`);
      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/events', () => {
    it('should create a new event as Admin', async () => {
      const response = await request(app.getHttpServer())
        .post(url)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(NEW_EVENT_DATA);

      expect(response.statusCode).toBe(201);
      expect(response.body.name).toBe(NEW_EVENT_DATA.name);
      expect(response.body.location.id).toBe(1);
      expect(response.body.categories).toHaveLength(2);
    });

    it('should return 403 Forbidden for regular User', async () => {
      const response = await request(app.getHttpServer())
        .post(url)
        .set('Authorization', `Bearer ${userAuthToken}`)
        .send(NEW_EVENT_DATA);

      expect(response.statusCode).toBe(403);
    });

    it('should fail with 400 if date format is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post(url)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send({ ...NEW_EVENT_DATA, date: 'geen-datum' });

      expect(response.statusCode).toBe(400);
    });

    testAuthHeader(() =>
      request(app.getHttpServer()).post(url).send(NEW_EVENT_DATA),
    );
  });

  describe('PUT /api/events/:id', () => {
    it('should update event as Admin', async () => {
      const response = await request(app.getHttpServer())
        .put(`${url}/1`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send({ name: 'Updated Festival' });

      expect(response.statusCode).toBe(200);
      expect(response.body.name).toBe('Updated Festival');
    });

    it('should return 403 for regular User', async () => {
      const response = await request(app.getHttpServer())
        .put(`${url}/1`)
        .set('Authorization', `Bearer ${userAuthToken}`)
        .send({ name: 'Hacked Festival' });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete event as Admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${url}/1`)
        .set('Authorization', `Bearer ${adminAuthToken}`);

      expect(response.statusCode).toBe(204);
    });

    it('should return 404 if deleting non-existing event', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${url}/999`)
        .set('Authorization', `Bearer ${adminAuthToken}`);

      expect(response.statusCode).toBe(404);
    });
  });
});
