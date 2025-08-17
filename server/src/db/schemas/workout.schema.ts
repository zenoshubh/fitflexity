import { pgTable, uuid, varchar, integer, decimal, timestamp, text, date, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './user.schema';

// Workout type enum
export const workoutTypeEnum = pgEnum('workout_type', [
"weighted",
"bodyweight",
"HIIT",
"weighted+cardio",
"bodyweight+cardio",
]);

export const experienceLevelEnum = pgEnum('experience_level', [
"beginner",
"intermediate",
"advanced",
]);

export const workouts = pgTable('workouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  workoutType: workoutTypeEnum('workout_type').notNull(),
  numberOfDays: integer('number_of_days').notNull().default(3),
  experience: experienceLevelEnum('experience_level').notNull(),
  notes: text('notes'),
  plan: jsonb('plan').notNull(), // Full workout plan as JSON
  totalDurationMins: integer('total_duration_mins'), // Total duration in minutes (optional)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;

