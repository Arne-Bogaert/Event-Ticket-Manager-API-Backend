import { INestApplication } from '@nestjs/common';
import {
  DatabaseProvider,
  DrizzleAsyncProvider,
} from '../src/drizzle/drizzle.provider';
import request from 'supertest';
import { createTestApp } from './helpers/create-app';
import {
  seedLocations,
  clearLocations,
  LOCATIONS_EXPECTED_DTO,
} from './seeds/locations';
import { clearUsers, seedUsers } from './seeds/users';
import { login, loginAdmin } from './helpers/login';
import testAuthHeader from './helpers/testAuthHeader';

const NEW_LOCATION_DATA = {
  name: 'Nieuwe Locatie Test POST',
  street: 'Teststraat 1',
  city: 'Teststad',
  postalCode: '1000',
  country: 'Testland',
};

describe('Locations', () => {
  let app: INestApplication;
  let drizzle: DatabaseProvider;
  let userAuthToken: string;
  let adminAuthToken: string;

  const url = '/api/locations';

  beforeAll(async () => {
    app = await createTestApp();
    drizzle = app.get(DrizzleAsyncProvider);

    await clearLocations(drizzle);
    await clearUsers(drizzle);
    await seedLocations(drizzle);
    await seedUsers(app, drizzle);

    userAuthToken = await login(app);
    adminAuthToken = await loginAdmin(app);
  });

  afterAll(async () => {
    await clearLocations(drizzle);
    await clearUsers(drizzle);
    await app.close();
  });

  describe('GET /api/locations', () => {
    it('should return 200 and all seeded locations (public access)', async () => {
      const response = await request(app.getHttpServer()).get(url);

      expect(response.statusCode).toBe(200);
      expect(response.body.items).toEqual(
        expect.arrayContaining(LOCATIONS_EXPECTED_DTO),
      );
    });
  });

  describe('GET /api/locations/:id', () => {
    it('should 200 and return the requested location', async () => {
      const expectedLocation = LOCATIONS_EXPECTED_DTO[0];

      const response = await request(app.getHttpServer()).get(`${url}/1`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(expectedLocation);
    });

    it('should 404 when requesting a non-existing location', async () => {
      const response = await request(app.getHttpServer()).get(`${url}/999`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe('Location met id 999 niet gevonden');
    });

    it('should 400 with invalid location id', async () => {
      const response = await request(app.getHttpServer()).get(`${url}/invalid`);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(
        'Validation failed (numeric string is expected)',
      );
    });
  });

  describe('POST /api/locations', () => {
    const postUrl = '/api/locations';

    it('should return 201 and the created location as Admin', async () => {
      const response = await request(app.getHttpServer())
        .post(postUrl)
        .auth(adminAuthToken, { type: 'bearer' })
        .send(NEW_LOCATION_DATA);

      expect(response.statusCode).toBe(201);
      expect(response.body).toMatchObject({
        ...NEW_LOCATION_DATA,
        id: expect.any(Number),
      });
      expect(response.body.id).toBeGreaterThan(2);
    });

    it('should return 400 Bad Request when missing name', async () => {
      const invalidData = {
        street: NEW_LOCATION_DATA.street,
        city: NEW_LOCATION_DATA.city,
        postalCode: NEW_LOCATION_DATA.postalCode,
        country: NEW_LOCATION_DATA.country,
      };

      const response = await request(app.getHttpServer())
        .post(postUrl)
        .send(invalidData)
        .auth(adminAuthToken, { type: 'bearer' });

      expect(response.statusCode).toBe(400);
      expect(response.body.details.body).toHaveProperty('name');
    });

    it('should return 403 Forbidden as regular user', async () => {
      const response = await request(app.getHttpServer())
        .post(postUrl)
        .auth(userAuthToken, { type: 'bearer' })
        .send(NEW_LOCATION_DATA);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe(
        'You do not have access to this resource',
      );
    });

    testAuthHeader(() =>
      request(app.getHttpServer()).post(postUrl).send(NEW_LOCATION_DATA),
    );
  });

  describe('PUT /api/locations/:id', () => {
    it('should 200 and return the updated location', async () => {
      const response = await request(app.getHttpServer())
        .put(`${url}/1`)
        .send({
          name: 'Changed name',
          street: 'Changed street',
          city: 'Changed city',
          postalCode: '9999',
          country: 'Changed country',
        })
        .auth(adminAuthToken, { type: 'bearer' });

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Changed name',
          street: 'Changed street',
          city: 'Changed city',
          postalCode: '9999',
          country: 'Changed country',
        }),
      );
    });

    it('should 400 when name is too long', async () => {
      const response = await request(app.getHttpServer())
        .put(`${url}/1`)
        .send({
          name: 'a'.repeat(256),
        })
        .auth(adminAuthToken, { type: 'bearer' });

      expect(response.statusCode).toBe(400);
      expect(response.body.details.body).toHaveProperty('name');
    });

    it('should 400 when postalCode is too long', async () => {
      const response = await request(app.getHttpServer())
        .put(`${url}/1`)
        .send({
          postalCode: '123456789012345678901',
        })
        .auth(adminAuthToken, { type: 'bearer' });

      expect(response.statusCode).toBe(400);
      expect(response.body.details.body).toHaveProperty('postalCode');
    });

    it('should return 403 Forbidden as regular user', async () => {
      const response = await request(app.getHttpServer())
        .put(`${url}/1`)
        .auth(userAuthToken, { type: 'bearer' })
        .send({ name: 'Changed name' });

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe(
        'You do not have access to this resource',
      );
    });

    testAuthHeader(() =>
      request(app.getHttpServer())
        .put(`${url}/1`)
        .send({ name: 'Changed name' }),
    );
  });

  describe('DELETE /api/locations/:id', () => {
    it('should 204 and return nothing', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${url}/1`)
        .auth(adminAuthToken, { type: 'bearer' });

      expect(response.statusCode).toBe(204);
      expect(response.body).toEqual({});
    });

    it('should 400 with invalid location id', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${url}/invalid`)
        .auth(adminAuthToken, { type: 'bearer' });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(
        'Validation failed (numeric string is expected)',
      );
    });

    it('should 404 with not existing location', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${url}/999`)
        .auth(adminAuthToken, { type: 'bearer' });

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe(
        'Location met id 999 kon niet verwijderd worden',
      );
    });

    testAuthHeader(() => request(app.getHttpServer()).delete(`${url}/1`));
  });
});
