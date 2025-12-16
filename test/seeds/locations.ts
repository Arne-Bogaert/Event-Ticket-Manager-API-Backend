import { DatabaseProvider } from '../../src/drizzle/drizzle.provider';
import { locations } from '../../src/drizzle/schema';

export const LOCATIONS_SEED = [
  {
    id: 1,
    name: 'Sportpaleis Test',
    street: 'Schijnpoortweg 119',
    city: 'Antwerpen',
    postal_code: '2170',
    country: 'Belgium',
  },
  {
    id: 2,
    name: 'Vooruit Test',
    street: 'Sint-Pietersnieuwstraat 23',
    city: 'Gent',
    postal_code: '9000',
    country: 'Belgium',
  },
];

export const LOCATIONS_EXPECTED_DTO = [
  {
    id: 1,
    name: 'Sportpaleis Test',
    street: 'Schijnpoortweg 119',
    city: 'Antwerpen',
    postalCode: '2170',
    country: 'Belgium',
  },
  {
    id: 2,
    name: 'Vooruit Test',
    street: 'Sint-Pietersnieuwstraat 23',
    city: 'Gent',
    postalCode: '9000',
    country: 'Belgium',
  },
];

export async function seedLocations(drizzle: DatabaseProvider) {
  await drizzle.insert(locations).values(LOCATIONS_SEED);
}

export async function clearLocations(drizzle: DatabaseProvider) {
  await drizzle.delete(locations);
}
