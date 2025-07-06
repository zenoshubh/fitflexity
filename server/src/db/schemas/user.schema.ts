import { pgTable, uuid, varchar, timestamp, date } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    firstName: varchar('first_name', { length: 50 }).notNull(),
    lastName: varchar('last_name', { length: 50 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    dateOfBirth: date('date_of_birth'),
    provider: varchar('provider', { length: 20 }).notNull().default('google'),
    googleId: varchar('google_id', { length: 100 }).notNull().unique(),
    refreshToken: varchar('refresh_token', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
