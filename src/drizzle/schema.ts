import {
  mysqlTable,
  int,
  varchar,
  decimal,
  date,
  time,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ---------------------------
// USERS
// ---------------------------
export const users = mysqlTable(
  'users',
  {
    id: int('id', { unsigned: true }).primaryKey().autoincrement(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull().default('user'),
  },
  (table) => ({
    emailIndex: uniqueIndex('email_idx').on(table.email),
  }),
);

// ---------------------------
// LOCATIONS
// ---------------------------
export const locations = mysqlTable('locations', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  street: varchar('street', { length: 255 }).notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  postal_code: varchar('postal_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
});

// ---------------------------
// EVENTS
// ---------------------------
export const events = mysqlTable('events', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  date: date('date').notNull(),
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  location_id: int('location_id', { unsigned: true })
    .references(() => locations.id, { onDelete: 'no action' })
    .notNull(),
});

// ---------------------------
// TICKETS
// ---------------------------
export const tickets = mysqlTable('tickets', {
  id: int('id', { unsigned: true }).primaryKey().autoincrement(),
  price: decimal('price', { precision: 8, scale: 2 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  event_id: int('event_id', { unsigned: true })
    .references(() => events.id, { onDelete: 'cascade' })
    .notNull(),
  user_id: int('user_id', { unsigned: true })
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
});

// ---------------------------
// CATEGORIES
// ---------------------------
export const categories = mysqlTable(
  'categories',
  {
    id: int('id', { unsigned: true }).primaryKey().autoincrement(),
    name: varchar('name', { length: 255 }).notNull(),
  },
  (table) => ({
    nameIndex: uniqueIndex('category_name_idx').on(table.name),
  }),
);

// ---------------------------
// EVENT_CATEGORIES (many-to-many)
// ---------------------------
export const eventCategories = mysqlTable(
  'event_categories',
  {
    event_id: int('event_id', { unsigned: true })
      .references(() => events.id, { onDelete: 'cascade' })
      .notNull(),
    category_id: int('category_id', { unsigned: true })
      .references(() => categories.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.event_id, table.category_id] })],
);

// ---------------------------
// RELATIONS
// ---------------------------

// Users -> Tickets
export const usersRelations = relations(users, ({ many }) => ({
  tickets: many(tickets),
}));

// Locations -> Events
export const locationsRelations = relations(locations, ({ many }) => ({
  events: many(events),
}));

// Events -> Location, Tickets, EventCategories
export const eventsRelations = relations(events, ({ one, many }) => ({
  location: one(locations, {
    fields: [events.location_id],
    references: [locations.id],
  }),
  tickets: many(tickets),
  eventCategories: many(eventCategories),
}));

// Tickets -> Event, User
export const ticketsRelations = relations(tickets, ({ one }) => ({
  event: one(events, {
    fields: [tickets.event_id],
    references: [events.id],
  }),
  user: one(users, {
    fields: [tickets.user_id],
    references: [users.id],
  }),
}));

// Categories -> EventCategories
export const categoriesRelations = relations(categories, ({ many }) => ({
  eventCategories: many(eventCategories),
}));

// EventCategories -> Event, Category
export const eventCategoriesRelations = relations(
  eventCategories,
  ({ one }) => ({
    event: one(events, {
      fields: [eventCategories.event_id],
      references: [events.id],
    }),
    category: one(categories, {
      fields: [eventCategories.category_id],
      references: [categories.id],
    }),
  }),
);
