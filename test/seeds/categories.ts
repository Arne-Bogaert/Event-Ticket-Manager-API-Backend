import { DatabaseProvider } from '../../src/drizzle/drizzle.provider';
import { categories } from '../../src/drizzle/schema';

export const CATEGORIES_SEED = [
  {
    id: 1,
    name: 'Concert',
  },
  {
    id: 2,
    name: 'Festival',
  },
];

export const CATEGORIES_EXPECTED_DTO = [
  {
    id: 1,
    name: 'Concert',
  },
  {
    id: 2,
    name: 'Festival',
  },
];

export async function seedCategories(db: DatabaseProvider) {
  await db.insert(categories).values(CATEGORIES_SEED);
}

export async function clearCategories(db: DatabaseProvider) {
  await db.delete(categories);
}
