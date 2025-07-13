import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { llm } from "@/lib/llm";

const BMRcalculator =
    (weight: number, height: number, age: number, gender: string): number => {
        if (gender == "male") {
            return 10 * weight + 6.25 * height - 5 * age + 5;
        }
        else if (gender == "female") {
            return 10 * weight + 6.25 * height - 5 * age - 161;
        }
        // Default case to avoid undefined return
        return 10 * weight + 6.25 * height - 5 * age; // Default formula without gender adjustment
    }

const TDEEcalculator = (bmr: number, activityLevel: number) => {
    return bmr * activityLevel;
};

const calorieCalculator =
    (currentWeight: number, goalWeight: number, TDEE: number, goalDurationDays: number) => {
        const weightDiff = goalWeight - currentWeight; // positive = gain, negative = loss

        // 1 kg fat ≈ 7700 kcal
        const totalCaloriesToChange = weightDiff * 7700;

        // Daily surplus or deficit
        const dailyChange = totalCaloriesToChange / goalDurationDays;

        // Final calorie intake = TDEE ± dailyChange
        const dailyCalorieIntake = TDEE + dailyChange;

        if (dailyCalorieIntake < 1200) {
            return 1200; // Minimum daily intake to avoid malnutrition
        }

        return dailyCalorieIntake;
    }


export async function generateDietPlanWithAgent(userDetails: any, dietPreferences: any) {
    const { weightInKgs, heightInCms, dateOfBirth, bodyFatPercentage, activityLevel, gender } = userDetails;
    const { dietType, goal, desiredWeight, numberOfMeals, intolerancesAndAllergies, excludedFoods, goalDurationDays, notes } = dietPreferences;

    const age = dateOfBirth ? new Date().getFullYear() - new Date(dateOfBirth).getFullYear() : 30; // Default age of 30 if not provided

    // Activity level mapping
    const activityLevelMap = {
        "sedentary": 1.2,
        "lightly_active": 1.375,
        "moderately_active": 1.55,
        "very_active": 1.725,
        "super_active": 1.9
    };

    type ActivityLevel = keyof typeof activityLevelMap;
    const activityMultiplier = activityLevelMap[activityLevel as ActivityLevel] || 1.2;

    const bmr = BMRcalculator(weightInKgs, heightInCms, age as number, gender);
    const tdee = TDEEcalculator(bmr, activityMultiplier);
    const dailyCalorieIntake = calorieCalculator(weightInKgs, desiredWeight, tdee, goalDurationDays);
    console.log(`BMR: ${bmr}, TDEE: ${tdee}, Daily Calorie Intake: ${dailyCalorieIntake}`);

    const PROMPT =
        `I need a detailed diet plan with the following details:
    - Goal: ${goal}
    - Diet Type: ${dietType}
    - Daily Calorie Intake: ${dailyCalorieIntake} kcal
    - Number of Meals: ${numberOfMeals}
    - Intolerances / Allergies: ${intolerancesAndAllergies || "None"}
    - Excluded Foods: ${excludedFoods || "None"}
    - Notes: ${notes || "None"}

    IMPORTANT POINTS:
    - The total daily calorie (${dailyCalorieIntake}) intake should be distributed across ${numberOfMeals} meals.
    - The total calorie should be strictly equal to the daily calorie intake value provided (${dailyCalorieIntake} plus minus 20).
    - Protein should be around 1.6-2.0g per kg of body weight.
    - Keep the diet plan healthy and balanced, considering the user's preferences, dietary restrictions, micro and macronutrient needs, and overall health.

    FORMAT:
    Return ONLY a JSON array in the following format (no extra text, no explanation, no markdown):

    [
      {
        "mealNumber": 1,
        "mealName": "Breakfast",
        "items": [
          { "name": "Scrambled Eggs", "qty": "2 large", "fats": 9.5, "carbs": 1.1, "fibers": 0, "protein": 12.6, "calories": 143 },
          { "name": "Cottage Cheese (Low-fat)", "qty": "150 g", "fats": 0, "carbs": 6, "fibers": 0, "protein": 15, "calories": 84 },
          { "name": "Orange", "qty": "1 medium", "fats": 0.2, "carbs": 15.4, "fibers": 2.8, "protein": 1, "calories": 69 }
        ]
      },
      ...
      {
        "Total": { "fats": 46.2, "carbs": 112.4, "fibers": 19.2, "protein": 105.6, "calories": 1272 }
      }
    ]

    - Each meal should be an object with mealNumber, mealName, and an items array.
    - Each item must have: name, qty, fats, carbs, fibers, protein, calories.
    - The last object in the array must be a "Total" object with summed macros for the day.
    - Do NOT include any extra text, explanation, or markdown. Only output the JSON array as shown above.
    `

    const result = await llm.invoke(PROMPT);

    console.log(`Diet Plan Generated\n: ${result.content}`);

    return result.content;
}
