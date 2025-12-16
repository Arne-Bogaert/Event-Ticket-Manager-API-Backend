import { DatabaseProvider } from '../../src/drizzle/drizzle.provider';
import { events, eventCategories } from '../../src/drizzle/schema';
import { LOCATIONS_EXPECTED_DTO } from './locations';

export const EVENTS_SEED = [
  {
    id: 1,
    name: 'Rock Werchter',
    date: new Date('2026-07-01'),
    start_time: '12:00:00',
    end_time: '23:59:00',
    location_id: 1,
  },
  {
    id: 2,
    name: 'I Love Techno',
    date: new Date('2026-11-10'),
    start_time: '20:00:00',
    end_time: '06:00:00',
    location_id: 2,
  },
];

export const EVENT_CATEGORIES_SEED = [
  { event_id: 1, category_id: 1 },
  { event_id: 1, category_id: 2 },
  { event_id: 2, category_id: 2 },
];

export const EVENTS_EXPECTED_DTO = [
  {
    id: 1,
    name: 'Rock Werchter',
    date: '2026-07-01T00:00:00.000Z',
    startTime: '12:00:00',
    endTime: '23:59:00',
    location: LOCATIONS_EXPECTED_DTO[0],

    categories: expect.any(Array),
  },
  {
    id: 2,
    name: 'I Love Techno',
    date: '2026-11-10T00:00:00.000Z',
    startTime: '20:00:00',
    endTime: '06:00:00',
    location: LOCATIONS_EXPECTED_DTO[1],
    categories: expect.any(Array),
  },
];

export async function seedEvents(db: DatabaseProvider) {
  await db.insert(events).values(EVENTS_SEED);
  await db.insert(eventCategories).values(EVENT_CATEGORIES_SEED);
}

export async function clearEvents(db: DatabaseProvider) {
  await db.delete(eventCategories);
  await db.delete(events);
}
