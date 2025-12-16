import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as schema from './schema';
import * as argon2 from 'argon2';
import { Role } from '../auth/roles';

// Maak een verbinding met de database
const connection = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 5,
});

// Maak een Drizzle client
const db = drizzle(connection, {
  schema,
  mode: 'default',
});

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    hashLength: 32,
    timeCost: 2,
    memoryCost: 2 ** 16,
  });
}

// Functie om de database volledig leeg te maken in de juiste volgorde
async function resetDatabase() {
  console.log('🗑️ Resetting database...');

  await db.delete(schema.eventCategories);
  await db.delete(schema.tickets);
  await db.delete(schema.events);
  await db.delete(schema.categories);
  await db.delete(schema.locations);
  await db.delete(schema.users);

  console.log('✅ Database reset completed\n');
}

// Functie om users toe te voegen
async function seedUsers() {
  console.log('👤 Seeding users...');

  await db.insert(schema.users).values([
    {
      id: 1,
      name: 'Arne Bogaert',
      email: 'arne.bogaert@example.com',
      password: await hashPassword('12345678'),
      role: Role.ADMIN,
    },
    {
      id: 2,
      name: 'Marie Claes',
      email: 'marie.claes@example.com',
      password: await hashPassword('12345678'),
      role: Role.USER,
    },
    {
      id: 3,
      name: 'Tom Janssens',
      email: 'tom.janssens@example.com',
      password: await hashPassword('12345678'),
      role: Role.ADMIN,
    },
  ]);

  console.log('✅ Users seeded successfully\n');
}

// Functie om locations toe te voegen
async function seedLocations() {
  console.log('📍 Seeding locations...');

  await db.insert(schema.locations).values([
    {
      id: 1,
      name: 'Sportpaleis',
      street: 'Schijnpoortweg 119',
      city: 'Antwerpen',
      postal_code: '2170',
      country: 'Belgium',
    },
    {
      id: 2,
      name: 'Vooruit',
      street: 'Sint-Pietersnieuwstraat 23',
      city: 'Gent',
      postal_code: '9000',
      country: 'Belgium',
    },
  ]);

  console.log('✅ Locations seeded successfully\n');
}

// Functie om categories toe te voegen
async function seedCategories() {
  console.log('🏷️ Seeding categories...');

  await db.insert(schema.categories).values([
    { id: 1, name: 'Concert' },
    { id: 2, name: 'Theater' },
    { id: 3, name: 'Sport' },
  ]);

  console.log('✅ Categories seeded successfully\n');
}

// Functie om events toe te voegen
async function seedEvents() {
  console.log('🎫 Seeding events...');

  await db.insert(schema.events).values([
    {
      id: 1,
      name: 'Rock Concert',
      date: new Date('2025-11-15'),
      start_time: '20:00:00',
      end_time: '23:00:00',
      location_id: 1,
    },
    {
      id: 2,
      name: 'Shakespeare Play',
      date: new Date('2025-11-20'),
      start_time: '19:00:00',
      end_time: '22:00:00',
      location_id: 2,
    },
  ]);

  console.log('✅ Events seeded successfully\n');
}

// Functie om tickets toe te voegen
async function seedTickets() {
  console.log('🎟️ Seeding tickets...');

  await db.insert(schema.tickets).values([
    { id: 1, price: '50.00', type: 'VIP', event_id: 1, user_id: 1 },
    { id: 2, price: '30.00', type: 'Standard', event_id: 1, user_id: 2 },
    { id: 3, price: '40.00', type: 'Standard', event_id: 2, user_id: 3 },
  ]);

  console.log('✅ Tickets seeded successfully\n');
}

// Functie om eventCategories toe te voegen (many-to-many)
async function seedEventCategories() {
  console.log('🔗 Seeding eventCategories...');

  await db.insert(schema.eventCategories).values([
    { event_id: 1, category_id: 1 }, // Rock Concert -> Concert
    { event_id: 2, category_id: 2 }, // Shakespeare Play -> Theater
  ]);

  console.log('✅ EventCategories seeded successfully\n');
}

// Main functie
async function main() {
  console.log('🌱 Starting database seeding...\n');

  await resetDatabase();
  await seedUsers();
  await seedLocations();
  await seedCategories();
  await seedEvents();
  await seedTickets();
  await seedEventCategories();

  console.log('🎉 Database seeding completed successfully!');
}

// Voer de main functie uit
main()
  .then(async () => {
    await connection.end();
  })
  .catch(async (e) => {
    console.error(e);
    await connection.end();
    process.exit(1);
  });
