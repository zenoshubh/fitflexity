import db from "@/db";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { eq } from "drizzle-orm";
import { users, type User } from "@/db/schemas/user.schema";
import { callGenAI } from "@/lib/LLM";


const generateDietPlan = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const userDetails: {
        weightInKgs: string | null;
        heightInCms: string | null;
        dateOfBirth: string | null;
        bodyType: "ectomorph" | "mesomorph" | "endomorph" | null;
        activityLevel: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "super_active" | null;
    }[] =
        await db.select({
            weightInKgs: users.weightInKgs,
            heightInCms: users.heightInCms,
            dateOfBirth: users.dateOfBirth,
            bodyType: users.bodyType,
            activityLevel: users.activityLevel
        }).from(users)
            .where(eq(users.id, user.id))

    if (userDetails.length === 0 || !userDetails[0]) {
        throw new ApiError(404, "User details not found");
    }
    const { weightInKgs, heightInCms, dateOfBirth, bodyType, activityLevel } = userDetails[0];

    const { dietType, goal, desiredWeight } = req.body;

    if (!dietType || !goal || desiredWeight === undefined) {
        throw new ApiError(400, "All fields are required");
    }

    const prompt = `
You are a nutrition expert. Generate a detailed daily diet plan for fat loss for a user with the following details:

- Age: ${dateOfBirth ? `${new Date().getFullYear() - new Date(dateOfBirth).getFullYear()} years` : "N/A"}
- Weight: ${weightInKgs || "N/A"} kg
- Height: ${heightInCms || "N/A"} cm
- Body Type: ${bodyType || "N/A"}
- Activity Level: ${activityLevel || "N/A"}
- Diet Type: ${dietType}
- Goal: ${goal}
- Desired Weight: ${desiredWeight} kg

**Instructions:**
- The plan should be in JSON array format.
- Each meal should have: mealNumber, mealName, items (array of objects with name, qty, protein, carbs, fats, fibers, calories).
- Use the following JSON structure:
[
  {
    "mealNumber": 1,
    "mealName": "Breakfast",
    "items": [
      { "name": "Milk", "qty": "200 ml", "protein": 6, "carbs": 9.4, "fats": 7, "fibers": 0, "calories": 124 },
      ...
    ]
  },
  ...
]
- Include 4-6 meals (breakfast, lunch, snacks, dinner, etc).
- For each item, provide realistic Indian food options and accurate nutritional values.
- At the end, add a "Total" object with total weight, protein, carbs, fats, fibers, and calories for the day.
- Do NOT include any explanation, only return the JSON array as described above.
`;

    let planJson;
    try {
        const dietPlan = await callGenAI(prompt);

        // Convert the AI response to string
        const dietPlanText = typeof dietPlan === 'string'
            ? dietPlan
            : Array.isArray(dietPlan)
                ? JSON.stringify(dietPlan)
                : String(dietPlan);

        // Try to extract JSON from the response (in case model adds extra text)
        const jsonMatch = dietPlanText.match(/\[.*\]/s);
        const jsonString = jsonMatch ? jsonMatch[0] : dietPlanText;

        planJson = JSON.parse(jsonString);

        console.log("Generated Diet Plan:", planJson);
        
    } catch (error) {
        throw new ApiError(500, "Failed to generate or parse diet plan");
    }

   return res.status(200).json(
        new ApiResponse(200, { plan: planJson }, "Diet plan generated successfully")
    );
});

export { generateDietPlan };