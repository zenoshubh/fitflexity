import { pgTable, uuid, varchar, integer, decimal, timestamp, text, date, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './user.schema';
import { sql } from 'drizzle-orm';

export const weightLogs = pgTable('weight_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    weightInKgs: decimal('weight', { precision: 5, scale: 2 }).notNull(),
    date: timestamp("date").default(sql`CURRENT_TIMESTAMP`),
})