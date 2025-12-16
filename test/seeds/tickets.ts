import { DatabaseProvider } from '../../src/drizzle/drizzle.provider';
import { tickets } from '../../src/drizzle/schema';
import { TEST_USERS } from './users';

export const TICKETS_SEED = [
  {
    id: 1,
    price: '50.00',
    type: 'VIP',
    event_id: 1,
    user_id: TEST_USERS.USER.id,
  },
  {
    id: 2,
    price: '25.00',
    type: 'Standard',
    event_id: 2,
    user_id: TEST_USERS.USER.id,
  },
];

export const TICKETS_EXPECTED_DTO = [
  {
    id: 1,
    price: 50,
    type: 'VIP',
    event: { id: 1, name: 'Rock Werchter' },
    user: { id: TEST_USERS.USER.id, name: TEST_USERS.USER.name },
  },
  {
    id: 2,
    price: 25,
    type: 'Standard',
    event: { id: 2, name: 'I Love Techno' },
    user: { id: TEST_USERS.USER.id, name: TEST_USERS.USER.name },
  },
];

export async function seedTickets(db: DatabaseProvider) {
  await db.insert(tickets).values(TICKETS_SEED);
}

export async function clearTickets(db: DatabaseProvider) {
  await db.delete(tickets);
}
