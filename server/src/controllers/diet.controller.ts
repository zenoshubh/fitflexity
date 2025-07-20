import db from "@/db";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { eq } from "drizzle-orm";
import { users, type User } from "@/db/schemas/user.schema";
import { diets, type NewDiet } from "@/db/schemas/diet.schema";
import { PineconeStore } from "@langchain/pinecone";
import { Document } from "@langchain/core/documents";
import { generateDietPlanWithLLM } from "@/utils/agents/dietPlanGenerator";
import { llm } from "@/lib/llm";
import { queue as embedDietPlanQueue } from "@/lib/bullmq";
import { embeddings } from "@/lib/rag";
import { AIMessageChunk } from "@langchain/core/messages";
import { initialiseVectorStore } from "@/lib/vectorStore";

const generateDietPlan = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const userDetails: {
        weightInKgs: string | null;
        heightInCms: string | null;
        dateOfBirth: string | null;
        gender: "male" | "female" | "other" | null;
        bodyFatPercentage: string | null;
        activityLevel: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "super_active" | null;
    }[] =
        await db.select({
            weightInKgs: users.weightInKgs,
            heightInCms: users.heightInCms,
            dateOfBirth: users.dateOfBirth,
            gender: users.gender,
            bodyFatPercentage: users.bodyFatPercentage,
            activityLevel: users.activityLevel
        }).from(users)
            .where(eq(users.id, user.id))

    if (userDetails.length === 0 || !userDetails[0]) {
        throw new ApiError(404, "User details not found");
    }

    const goal = user.goal || "maintain_weight";

    const { dietType, desiredWeight, numberOfMeals, numberOfMealOptions, intolerancesAndAllergies, excludedFoods, notes } = req.body;

    if (!dietType || desiredWeight === undefined || numberOfMeals === undefined || numberOfMealOptions === undefined ) {
        throw new ApiError(400, "All fields are required");
    }

    let planJson: any;
    try {
        const dietPlan = await generateDietPlanWithLLM(
            userDetails[0],
            { dietType, goal, desiredWeight, numberOfMeals, numberOfMealOptions, intolerancesAndAllergies, excludedFoods, notes }
        );

        if (!dietPlan) {
            throw new ApiError(500, "Failed to generate diet plan");
        }

        // Convert the AI response to string
        const dietPlanText = typeof dietPlan === 'string'
            ? dietPlan
            : Array.isArray(dietPlan)
                ? JSON.stringify(dietPlan)
                : String(dietPlan);


        // Try to extract JSON from the response (in case model adds extra text)
        const jsonMatch = dietPlanText.match(/\[.*\]/s);
        const jsonString = jsonMatch ? jsonMatch[0] : dietPlanText;

        if (!jsonString) {
            throw new ApiError(500, "Failed to parse diet plan response");
        }

        planJson = JSON.parse(jsonString);


        const newDiet: NewDiet = {
            userId: user.id,
            name: `${goal.replace("_", " ")} Diet Plan`,
            description: `Auto-generated diet plan for ${goal.replace("_", " ")}.`,
            dietType,
            intolerancesAndAllergies: intolerancesAndAllergies || null,
            excludedFoods: excludedFoods || null,
            numberOfMeals,
            notes: notes || null,
            plan: planJson,
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

        // --- Offload vector DB indexing to background ---

        await embedDietPlanQueue.add("embed-diet-plan", {
            planJson,
            userId: user.id,
            goal: goal,
            planType: "diet",
        });




        // Return here so no further code runs in this handler
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

const updateDietPlan = asyncHandler(async (req, res) => {
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

    console.log(`User ${user.id} asked: ${question}`);


    if (!question) {
        throw new ApiError(400, "Question is required");
    }

    const vectorStore = await initialiseVectorStore({
        collectionName: "diet-plans"
    });

    // 4. Prepare filter
    let filter: any = undefined;
    if (user && user.id) {
        // Qdrant expects filter as { must: [{ key: "...", match: { value: ... } }] }
        if (process.env.NODE_ENV === "development") {
            filter = {
                must: [
                    {
                        key: "metadata.userId",
                        match: { value: user.id }
                    }
                ]
            };
        } else {
            // Pinecone expects a plain object
            filter = { userId: user.id };
        }
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
        console.log(`Found ${results.length} relevant diet plan entries for question: ${question}`);
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

    return res.status(200).json(
        new ApiResponse(200, {}, "Diet plan deleted successfully")
    );
})

export { generateDietPlan, fetchDietPlan, updateDietPlan, chatDietPlan, deleteDietPlan };