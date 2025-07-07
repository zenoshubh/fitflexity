import { pgTable, uuid, varchar, timestamp, date, boolean, decimal, pgEnum } from 'drizzle-orm/pg-core';

export const bodyTypeEnum = pgEnum('body_type', ["ectomorph", "mesomorph", "endomorph"]);

export const userActivityLevelEnum = pgEnum('activity_level', ["sedentary", "lightly_active", "moderately_active", "very_active", "super_active"]);

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    firstName: varchar('first_name', { length: 50 }).notNull(),
    lastName: varchar('last_name', { length: 50 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    dateOfBirth: date('date_of_birth'),
    weightInKgs: decimal('weight', { precision: 5, scale: 2 }),
    heightInCms: decimal('height', { precision: 5, scale: 2 }),
    bodyType: bodyTypeEnum('body_type'),
    activityLevel: userActivityLevelEnum('activity_level'),
    isProfileComplete: boolean('is_profile_complete').default(false).notNull(),
    googleId: varchar('google_id', { length: 100 }).notNull().unique(),
    refreshToken: varchar('refresh_token', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
