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
import { seedUsers, clearUsers } from './seeds/users';
import { seedTickets, clearTickets } from './seeds/tickets';
import { login, loginAdmin } from './helpers/login';
import testAuthHeader from './helpers/testAuthHeader';

const NEW_TICKET_DATA = {
  price: 30.0,
  type: 'Early Bird',
  eventId: 1,
  userId: 1,
};

describe('Tickets', () => {
  let app: INestApplication;
  let drizzle: DatabaseProvider;
  let userAuthToken: string;
  let adminAuthToken: string;

  const url = '/api/tickets';

  beforeAll(async () => {
    app = await createTestApp();
    drizzle = app.get(DrizzleAsyncProvider);

    await clearTickets(drizzle);
    await clearEvents(drizzle);
    await clearUsers(drizzle);
    await clearCategories(drizzle);
    await clearLocations(drizzle);

    await seedLocations(drizzle);
    await seedCategories(drizzle);
    await seedUsers(app, drizzle);
    await seedEvents(drizzle);
    await seedTickets(drizzle);

    userAuthToken = await login(app);
    adminAuthToken = await loginAdmin(app);
  });

  afterAll(async () => {
    await clearTickets(drizzle);
    await clearEvents(drizzle);
    await clearUsers(drizzle);
    await clearCategories(drizzle);
    await clearLocations(drizzle);
    await app.close();
  });

  describe('GET /api/tickets', () => {
    it('should return a list of tickets for logged in user', async () => {
      const response = await request(app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${userAuthToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.items[0]).toHaveProperty('price');
    });

    it('should allow admin to see tickets', async () => {
      const response = await request(app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${adminAuthToken}`);

      expect(response.statusCode).toBe(200);
    });

    testAuthHeader(() => request(app.getHttpServer()).get(url));
  });

  describe('GET /api/tickets/:id', () => {
    it('should return ticket details', async () => {
      const response = await request(app.getHttpServer())
        .get(`${url}/1`)
        .set('Authorization', `Bearer ${userAuthToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.id).toBe(1);
      expect(response.body.type).toBe('VIP');
    });

    it('should return 404 for non-existing ticket', async () => {
      const response = await request(app.getHttpServer())
        .get(`${url}/999`)
        .set('Authorization', `Bearer ${userAuthToken}`);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('POST /api/tickets', () => {
    it('should create a ticket', async () => {
      const response = await request(app.getHttpServer())
        .post(url)
        .set('Authorization', `Bearer ${userAuthToken}`)
        .send(NEW_TICKET_DATA);

      expect(response.statusCode).toBe(201);
      expect(response.body.type).toBe('Early Bird');
      expect(response.body.price).toBe(30);

      expect(response.body.user.id).toBe(1);
    });

    it('should fail with 400 if price is missing', async () => {
      const response = await request(app.getHttpServer())
        .post(url)
        .set('Authorization', `Bearer ${userAuthToken}`)
        .send({ type: 'Free', eventId: 1 });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('PUT /api/tickets/:id', () => {
    it('should update ticket type', async () => {
      const response = await request(app.getHttpServer())
        .put(`${url}/1`)
        .set('Authorization', `Bearer ${userAuthToken}`)
        .send({ type: 'Super VIP' });

      expect(response.statusCode).toBe(200);
      expect(response.body.type).toBe('Super VIP');
    });
  });

  describe('DELETE /api/tickets/:id', () => {
    it('should allow user to delete a ticket', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${url}/1`)
        .set('Authorization', `Bearer ${userAuthToken}`);

      expect(response.statusCode).toBe(204);
    });

    it('should return 404 when deleting non-existing ticket', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${url}/999`)
        .set('Authorization', `Bearer ${userAuthToken}`);

      expect(response.statusCode).toBe(404);
    });
  });
});
