import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { llm } from "@/lib/LLM";

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

    const PROMPT = `I need a detailed diet plan with the following details:
        - Diet Type: ${dietType}
        - Daily Calorie Intake: ${dailyCalorieIntake} kcal
        - Number of Meals: ${numberOfMeals}
        - Intolerances / Allergies: ${intolerancesAndAllergies || "None"}
- Excluded Foods: ${excludedFoods || "None"}
- Notes: ${notes || "None"}

The total daily calorie (${dailyCalorieIntake}) intake should be distributed across ${numberOfMeals} meals.
And the total calorie should be strictly equal to the daily calorie intake value provided(${dailyCalorieIntake} plus minus 20).
      After that, create a detailed daily diet plan in JSON format with the following structure:
[
    {
        "mealNumber": 1,
        "mealName": "Breakfast",
        "items": [
            { "name": "Milk", "qty": "200 ml", "protein": 6, "carbs": 9.4, "fats": 7, "fibers": 0, "calories": 124 }
        ]
    }
]
      At the end, add a "Total" object with total nutritional values for the day.
      Only return the JSON array, no explanations.`

    const result = await llm.invoke(PROMPT);
    return result.content;
}
