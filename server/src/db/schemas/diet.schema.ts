import { pgTable, uuid, varchar, integer, decimal, timestamp, text, date, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './user.schema';

// Optional: enums for type/goal if needed
export const dietTypeEnum = pgEnum('diet_type', [
  "vegetarian",
  "vegan",
  "keto",
  "paleo",
  "mediterranean",
  "custom"
]);

export const dietGoalEnum = pgEnum('diet_goal', [
  "weight_loss",
  "muscle_gain",
  "maintenance"
]);

export const diets = pgTable('diets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  dietType: dietTypeEnum('diet_type').notNull(),
  goal: dietGoalEnum('goal').notNull(),
  // Store the full plan as JSON
  plan: jsonb('plan').notNull(),
  totalProtein: decimal('total_protein', { precision: 5, scale: 2 }),
  totalCarbs: decimal('total_carbs', { precision: 5, scale: 2 }),
  totalFats: decimal('total_fats', { precision: 5, scale: 2 }),
  totalFibers: decimal('total_fibers', { precision: 5, scale: 2 }),
  totalCalories: integer('total_calories'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Diet = typeof diets.$inferSelect;
export type NewDiet = typeof diets.$inferInsert;