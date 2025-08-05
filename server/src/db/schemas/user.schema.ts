import { pgTable, uuid, varchar, timestamp, date, boolean, decimal, pgEnum } from 'drizzle-orm/pg-core';

export const userActivityLevelEnum = pgEnum('activity_level', ["sedentary", "lightly_active", "moderately_active", "very_active", "super_active"]);

export const userBodyFatEnum = pgEnum('body_fat_percentage', [
    "less_than_10",
    "between_11_and_18",
    "between_19_and_25",
    "more_than_26"
]);

export const goalEnum = pgEnum('goal', [
  "maintain_weight",
  "mild_weight_loss_0_25kg_per_week",
  "weight_loss_0_5kg_per_week",
  "extreme_weight_loss_1kg_per_week",
  "mild_weight_gain_0_25kg_per_week",
  "weight_gain_0_5kg_per_week",
  "extreme_weight_gain_1kg_per_week"
]);

export const userGenderEnum = pgEnum('gender', ["male", "female", "other"]);

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    firstName: varchar('first_name', { length: 50 }).notNull(),
    lastName: varchar('last_name', { length: 50 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    dateOfBirth: date('date_of_birth'),
    gender: userGenderEnum('gender'),
    initialWeightInKgs: decimal('initial_weight', { precision: 5, scale: 2 }),
    currentWeightInKgs: decimal('current_weight', { precision: 5, scale: 2 }),
    targetWeightInKgs: decimal('target_weight', { precision: 5, scale: 2 }),
    lastUpdatedWeightInKgs: decimal('last_updated_weight', { precision: 5, scale: 2 }),
    heightInCms: decimal('height', { precision: 5, scale: 2 }),
    bodyFatPercentage: userBodyFatEnum('body_fat_percentage'),
    activityLevel: userActivityLevelEnum('activity_level'),
    goal: goalEnum('goal'),
    updateRequired : boolean('update_required').default(false).notNull(),
    isProfileComplete: boolean('is_profile_complete').default(false).notNull(),
    googleId: varchar('google_id', { length: 100 }).notNull().unique(),
    refreshToken: varchar('refresh_token', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
