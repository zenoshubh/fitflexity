import { pgTable, uuid, varchar, integer, decimal, timestamp, text, date, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './user.schema';

// Optional: enums for type/goal if needed
export const dietTypeEnum = pgEnum('diet_type', [
  "vegetarian",
  "eggetarian",
  "nonvegetarian",
  "vegan",
  "keto",
  "paleo",
  "mediterranean",
  "gluten_free",
]);



export const diets = pgTable('diets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  dietType: dietTypeEnum('diet_type').notNull(),
  numberOfMeals: integer('number_of_meals').notNull().default(3),
  intolerancesAndAllergies: text('intolerances_and_allergies'), // Comma-separated list of food intolerances
  excludedFoods: text('excluded_foods'), // Comma-separated list of foods to exclude
  // Store the full plan as JSON
  notes : text('notes'), // Additional notes for the diet plan
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