import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { llm } from "@/lib/LLMconfig";

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

// Returns the daily calorie intake for any goal (maintenance, loss, gain)
function getGoalBasedDailyCalories({
    tdee,
    goalInfo
}: {
    tdee: number,
    goalInfo: { weeklyChange: number, type: "fat" | "muscle" },
}) {
    if (goalInfo.weeklyChange === 0) return tdee;

    const kcalPerKg = goalInfo.type === "fat" ? 7700 : 2600;
    const kcalPerWeek = goalInfo.weeklyChange * kcalPerKg;
    const dailyAdjustment = kcalPerWeek / 7;

    return tdee + dailyAdjustment > 1500 ? tdee + dailyAdjustment : 1500; // Ensure minimum intake of 1500 kcal
}

// Map goal to weekly change and type
const goalMap: Record<string, { weeklyChange: number, type: "fat" | "muscle" }> = {
    "maintain_weight": { weeklyChange: 0, type: "fat" }, // doesn't matter, 0 change

    // Fat loss
    "mild_weight_loss_0_25kg_per_week": { weeklyChange: -0.25, type: "fat" },
    "weight_loss_0_5kg_per_week": { weeklyChange: -0.5, type: "fat" },
    "extreme_weight_loss_1kg_per_week": { weeklyChange: -1, type: "fat" },

    // Muscle gain
    "mild_weight_gain_0_25kg_per_week": { weeklyChange: 0.25, type: "muscle" },
    "weight_gain_0_5kg_per_week": { weeklyChange: 0.5, type: "muscle" },
    "extreme_weight_gain_1kg_per_week": { weeklyChange: 1, type: "muscle" },
};


export async function generateDietPlanWithLLM(userDetails: any, dietPreferences: any) {
    const { weightInKgs, targetWeightInKgs, heightInCms, dateOfBirth, bodyFatPercentage, activityLevel, gender } = userDetails;
    const { dietType, goal, numberOfMeals, numberOfMealOptions, intolerancesAndAllergies, excludedFoods, notes } = dietPreferences;

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

    // --- New goal logic ---
    const goalInfo = goalMap[goal] || { weeklyChange: 0, type: "fat" }; // Default to maintenance
    const dailyCalorieIntake = getGoalBasedDailyCalories({
        tdee,
        goalInfo,
    });

    const PROMPT =
        `I need a detailed diet plan with the following details:
    - Goal: ${goal}
    - Diet Type: ${dietType}
    - Daily Calorie Intake: ${dailyCalorieIntake} kcal
    - Number of Meals: ${numberOfMeals}
    - No. of options per meal: ${numberOfMealOptions}
    - Intolerances / Allergies: ${intolerancesAndAllergies || "None"}
    - Excluded Foods: ${excludedFoods || "None"}
    - Notes: ${notes || "None"}

    IMPORTANT POINTS TO BE FOLLOWED(STRICTLY):
    - The total daily calorie (${dailyCalorieIntake}) intake should be distributed across ${numberOfMeals} meals.
    - The total calorie should be strictly equal to the daily calorie intake value provided (${dailyCalorieIntake} plus minus 20).
    - TOP PRIORITY: Protein should be around ${1.5 * targetWeightInKgs} - ${2.0 * targetWeightInKgs} grams. Include supplements if necessary.
    - Keep the diet plan healthy and balanced, considering the user's preferences, dietary restrictions, micro and macronutrient needs, and overall health.

    FORMAT:
    Return ONLY a JSON array in the following format (no extra text, no explanation, no markdown):

    [
      {
        "mealNumber": 1,
        "mealName": "Breakfast",
        "mealOptions": [
            {
                "items": [
                    { "name": "Scrambled Eggs", "qty": "2 large", "fats": 9.5, "carbs": 1.1, "fibers": 0, "protein": 12.6, "calories": 143 },
                    { "name": "Cottage Cheese (Low-fat)", "qty": "150 g", "fats": 0, "carbs": 6, "fibers": 0, "protein": 15, "calories": 84 },
                    ...(other items as needed)...
                    ]
            },
            {
                "items": [
                    { "name": "Oatmeal", "qty": "50 g", "fats": 3.5, "carbs": 27, "fibers": 4, "protein": 5, "calories": 150 },
                    ...(other items as needed)...
                    ]
            },
            ...(other meal options as needed)...
            ]
        },
      ...(other meals as needed)...
    ]

    - Each meal should be an object with mealNumber, mealName, and an items array.
    - Each meal option should be an object with an items array, and all options must have similar macronutrient distribution.
    - Items array should contain only 1-3 items per meal option.
    - Each item must have: name, qty, fats, carbs, fibers, protein, calories.
    - Do NOT include any extra text, explanation, or markdown. Only output the JSON array as shown above.
    `;
    const result = await llm.invoke(PROMPT);
    return {
        generatedDietPlan: result.content,
        dailyCalorieIntake: dailyCalorieIntake,
        dailyProteinIntake: 1.5 * targetWeightInKgs,
    };
}
