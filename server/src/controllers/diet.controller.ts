import db from "@/db";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { eq } from "drizzle-orm";
import { users, type User } from "@/db/schemas/user.schema";
import { diets, type NewDiet } from "@/db/schemas/diet.schema";
import { Document } from "@langchain/core/documents";
import { generateDietPlanWithLLM } from "@/utils/agents/dietPlanGenerator";
import { llm } from "@/lib/LLMconfig";
import { managePlanEmbeddingsQueue } from "@/lib/bullmq";
import { initialiseVectorStore } from "@/lib/vectorStore";

const generateDietPlan = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const { goal, currentWeightInKgs, targetWeightInKgs, heightInCms, dateOfBirth, activityLevel, gender } = user;

    const { dietType, numberOfMeals, numberOfMealOptions, intolerancesAndAllergies, excludedFoods, notes } = req.body;

    if (!dietType || numberOfMeals === undefined || numberOfMealOptions === undefined) {
        throw new ApiError(400, "All fields are required");
    }

    let planJson: any;
    try {
        const { generatedDietPlan, dailyCalorieIntake, dailyProteinIntake } = await generateDietPlanWithLLM(

            { goal, currentWeightInKgs, targetWeightInKgs, heightInCms, dateOfBirth, activityLevel, gender, dietType, numberOfMeals, numberOfMealOptions, intolerancesAndAllergies, excludedFoods, notes }
        );

        if (!generatedDietPlan) {
            throw new ApiError(500, "Failed to generate diet plan");
        }

        // Convert the AI response to string
        const dietPlanText = typeof generatedDietPlan === 'string'
            ? generatedDietPlan
            : Array.isArray(generatedDietPlan)
                ? JSON.stringify(generatedDietPlan)
                : String(generatedDietPlan);


        // Try to extract JSON from the response (in case model adds extra text)
        const jsonMatch = dietPlanText.match(/\[.*\]/s);
        const jsonString = jsonMatch ? jsonMatch[0] : dietPlanText;

        if (!jsonString) {
            throw new ApiError(500, "Failed to parse diet plan response");
        }

        planJson = JSON.parse(jsonString);


        const newDiet: NewDiet = {
            userId: user.id,
            name: `${goal?.replace("_", " ")} Diet Plan`,
            description: `Auto-generated diet plan for ${goal?.replace("_", " ")}.`,
            dietType,
            intolerancesAndAllergies: intolerancesAndAllergies || null,
            excludedFoods: excludedFoods || null,
            numberOfMeals,
            optionsPerMeal: numberOfMealOptions,
            notes: notes || null,
            plan: planJson,
            totalProtein: Math.round(dailyProteinIntake),
            totalCalories: Math.round(dailyCalorieIntake),
        }

        // --- Save to DB ---
        const savedDiet = await db.insert(diets).values(newDiet).returning();

        if (!savedDiet || savedDiet.length === 0) {
            throw new ApiError(500, "Failed to save diet plan");
        }

        // Respond to user immediately
        res.status(200).json(
            new ApiResponse(200, { plan: planJson }, "Diet plan generated and saved successfully")
        );

        await managePlanEmbeddingsQueue.add("embed-diet-plan", {
            planJson,
            userId: user.id,
            goal: goal,
            planType: "diet",
        });

        return;

    } catch (error) {
        throw new ApiError(500, "Failed to generate or parse diet plan");
    }
});

const fetchDietPlan = asyncHandler(async (req, res) => {

    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const userId = user.id;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const dietPlan = await db.select().from(diets).where(eq(diets.userId, userId));

    if (dietPlan.length === 0) {
        throw new ApiError(404, "Diet plan not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { plan: dietPlan[0]?.plan }, "Diet plan fetched successfully")
    );
})

const getDietPreferences = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const userId = user.id;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const dietPlan = await db.select({
        dietType: diets.dietType,
        numberOfMeals: diets.numberOfMeals,
        optionsPerMeal: diets.optionsPerMeal,
        intolerancesAndAllergies: diets.intolerancesAndAllergies,
        excludedFoods: diets.excludedFoods,
        notes: diets.notes,
    }).from(diets).where(eq(diets.userId, userId));

    if (dietPlan.length === 0 || !dietPlan[0]) {
        return res.status(200).json(
            new ApiResponse(200, { plan: null }, "No diet plan found for the user")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, {
            dietType: dietPlan[0].dietType,
            numberOfMeals: dietPlan[0].numberOfMeals,
            optionsPerMeal: dietPlan[0].optionsPerMeal,
            intolerancesAndAllergies: dietPlan[0].intolerancesAndAllergies,
            excludedFoods: dietPlan[0].excludedFoods,
            notes: dietPlan[0].notes
        }, "Diet preferences fetched successfully")
    );
})

const editDietPlan = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const userId = user.id;
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const { meal, updateInstruction } = req.body;
    if (!meal || !updateInstruction) {
        throw new ApiError(400, "Both meal and updateInstruction are required");
    }

    // Fetch current diet plan
    const dietPlanRows = await db.select().from(diets).where(eq(diets.userId, userId));
    if (!dietPlanRows.length) {
        throw new ApiError(404, "Diet plan not found");
    }

    // Add null check for dietPlanRows[0]
    if (!dietPlanRows[0] || !dietPlanRows[0].plan) {
        throw new ApiError(404, "Diet plan data is missing");
    }

    const currentPlan = dietPlanRows[0].plan as any[];

    // Find the meal index in the plan
    const mealIdx = currentPlan.findIndex((row: any) =>
        row.mealNumber === meal.mealNumber && row.mealName === meal.mealName
    );
    if (mealIdx === -1) {
        throw new ApiError(404, "Meal not found in diet plan");
    }

    // Prepare LLM prompt for meal update
    const SYSTEM_PROMPT = `
You are a nutrition expert AI. You will be given a meal from a user's diet plan in JSON format and an update instruction from the user.
Update the meal according to the instruction, keeping the format and macros structure the same.
Return ONLY the updated meal object in valid JSON.

Meal:
${JSON.stringify(meal, null, 2)}

Instruction:
${updateInstruction}
`;

    let updatedMeal;
    try {
        const llmResponse = await llm.invoke(SYSTEM_PROMPT);
        // Try to extract JSON from LLM response
        const llmResponseText = llmResponse.content.toString();
        const jsonMatch = llmResponseText.match(/\{[\s\S]*\}/);
        const mealJson = jsonMatch ? jsonMatch[0] : llmResponseText;
        updatedMeal = JSON.parse(mealJson);
    } catch (err) {
        throw new ApiError(500, "Failed to update meal using AI");
    }

    // Replace the meal in the plan
    const updatedPlan = [...currentPlan];
    updatedPlan[mealIdx] = updatedMeal;

    // Optionally, recalculate totals if needed (simple sum)
    const macroKeys = ["protein", "carbs", "fats", "fibers", "calories"];
    let totalMacros = { protein: 0, carbs: 0, fats: 0, fibers: 0, calories: 0 };
    updatedPlan.forEach((row: any) => {
        if (row.items && Array.isArray(row.items)) {
            row.items.forEach((item: any) => {
                macroKeys.forEach((key) => {
                    const val = Number(item[key]);
                    if (!isNaN(val)) totalMacros[key as keyof typeof totalMacros] += val;
                });
            });
        }
    });
    // Update or add the Total row
    let totalRowIdx = updatedPlan.findIndex(
        (row: any) => row.Total !== undefined || row.total !== undefined
    );
    const totalRow = { Total: { ...totalMacros } };
    if (totalRowIdx !== -1) {
        updatedPlan[totalRowIdx] = totalRow;
    } else {
        updatedPlan.push(totalRow);
    }

    // Save updated plan to DB
    const updatedDiet = await db
        .update(diets)
        .set({ plan: updatedPlan })
        .where(eq(diets.userId, userId))
        .returning();

    if (!updatedDiet.length) {
        throw new ApiError(500, "Failed to save updated diet plan");
    }

    return res.status(200).json(
        new ApiResponse(200, { plan: updatedPlan }, "Diet plan updated successfully")
    );
});

const chatDietPlan = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const { question } = req.body;

    if (!question) {
        throw new ApiError(400, "Question is required");
    }

    const vectorStore = await initialiseVectorStore({
        collectionName: "diet-plans"
    });

    let filter: any = {};
    // 4. Prepare filter
    if (user && user.id) {
        filter = {
            must: [
                {
                    key: "metadata.userId",
                    match: { value: user.id }
                }
            ]
        };
    }


    // 5. Similarity search
    let results;
    try {
        const similaritySearchResults = await vectorStore.similaritySearch(
            question,
            2,
            filter
        );
        results = similaritySearchResults.map((doc: Document) => doc.pageContent);
    } catch (error) {
        console.error("Error querying diet plan:", error);
        // Qdrant 400 error: return empty result instead of throwing
        return res.status(200).json(
            new ApiResponse(200, { context: null, sources: [] }, "No relevant information found in diet plan database")
        );
    }

    if (!results || results.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, { context: null, sources: [] }, "No relevant information found in diet plan database")
        );
    }

    const SYSTEM_PROMPT = `You are a helpful Nutrition and Fitness assistant. You will be provided with some context from a user's diet plan. 
Use this context as a reference to answer the user's question. 
If the answer is not directly available in the context, you can use your own nutrition knowledge and expertise to provide a helpful, detailed, and accurate response. 
Feel free to explain concepts, give suggestions, or add extra information even if it is not explicitly mentioned in the context. In case if user question is not related to diet plan, politely inform them that you can only answer questions related to their diet plan and general nutrition. 
You can answer meal recipes also.
IMPORTANT: Reply in less than 200 words. 

Context:
${JSON.stringify(results)}

User Question: ${question}
`;

    let answer = await llm.invoke(SYSTEM_PROMPT)
    const answerText = answer.content.toString();
    return res.status(200).json(
        new ApiResponse(200, { answer: answerText }, "Relevant diet plan information found")
    );
});

const deleteDietPlan = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const userId = user.id;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const dietPlan = await db.select().from(diets).where(eq(diets.userId, userId));

    if (dietPlan.length === 0) {
        throw new ApiError(404, "Diet plan not found");
    }

    await db.delete(diets).where(eq(diets.userId, userId));

    res.status(200).json(
        new ApiResponse(200, {}, "Diet plan deleted successfully")
    );

    await managePlanEmbeddingsQueue.add("delete-diet-plan", {
        userId: user.id,
        planType: "diet",
    });
})

const updateDietPlan = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    if (user.updateRequired === false) {
        throw new ApiError(400, "User update is not required");
    }

    await managePlanEmbeddingsQueue.add("delete-diet-plan", {
        userId: user.id,
        planType: "diet",
    });

    const { currentWeightInKgs, targetWeightInKgs, heightInCms, dateOfBirth, goal, activityLevel, gender } = user;

    const dietPreferences = await db.select({
        dietType: diets.dietType,
        numberOfMeals: diets.numberOfMeals,
        numberOfMealOptions: diets.optionsPerMeal,
        intolerancesAndAllergies: diets.intolerancesAndAllergies,
        excludedFoods: diets.excludedFoods,
        notes: diets.notes
    }).from(diets).where(eq(diets.userId, user.id));


    if (dietPreferences.length === 0 || !dietPreferences[0]) {
        throw new ApiError(404, "Diet preferences not found");
    }

    const { dietType, numberOfMeals, numberOfMealOptions, intolerancesAndAllergies, excludedFoods, notes } = dietPreferences[0];

    let planJson: any;
    try {
        const { generatedDietPlan, dailyCalorieIntake, dailyProteinIntake } = await generateDietPlanWithLLM(
            { currentWeightInKgs, targetWeightInKgs, heightInCms, dateOfBirth, activityLevel, gender, dietType, goal, numberOfMeals, numberOfMealOptions, intolerancesAndAllergies, excludedFoods, notes }
        );

        if (!generatedDietPlan) {
            throw new ApiError(500, "Failed to generate diet plan");
        }

        // Convert the AI response to string
        const dietPlanText = typeof generatedDietPlan === 'string'
            ? generatedDietPlan
            : Array.isArray(generatedDietPlan)
                ? JSON.stringify(generatedDietPlan)
                : String(generatedDietPlan);


        // Try to extract JSON from the response (in case model adds extra text)
        const jsonMatch = dietPlanText.match(/\[.*\]/s);
        const jsonString = jsonMatch ? jsonMatch[0] : dietPlanText;

        if (!jsonString) {
            throw new ApiError(500, "Failed to parse diet plan response");
        }

        planJson = JSON.parse(jsonString);


        const newDiet: Partial<NewDiet> = {
            name: `${goal?.replace("_", " ")} Diet Plan`,
            description: `Auto-generated diet plan for ${goal?.replace("_", " ")}.`,
            plan: planJson,
            totalProtein: dailyProteinIntake,
            totalCalories: dailyCalorieIntake,
            updatedAt: new Date(),
        };

        // --- Save to DB ---
        const savedDiet = await db
            .update(diets)
            .set(newDiet)
            .where(eq(diets.userId, user.id))
            .returning();

        if (!savedDiet || savedDiet.length === 0) {
            throw new ApiError(500, "Failed to save diet plan");
        }

        // Respond to user immediately
        res.status(200).json(
            new ApiResponse(200, { plan: planJson }, "Diet plan updated and saved successfully")
        );

        await managePlanEmbeddingsQueue.add("embed-diet-plan", {
            planJson,
            userId: user.id,
            goal: goal,
            planType: "diet",
        });

        return;

    } catch (error) {
        throw new ApiError(500, "Failed to generate or parse diet plan");
    }
})

export {
    generateDietPlan,
    fetchDietPlan,
    getDietPreferences,
    editDietPlan,
    updateDietPlan,
    chatDietPlan,
    deleteDietPlan
};