import db from "@/db";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { eq } from "drizzle-orm";
import { users, type User } from "@/db/schemas/user.schema";
import { diets, type NewDiet } from "@/db/schemas/diet.schema";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { generateDietPlanWithAgent } from "@/utils/agents/dietPlanGenerator";
import { llm } from "@/lib/llm";
import { queue as embedDietPlanQueue } from "@/lib/bullmq";

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

    const { dietType, goal, desiredWeight, numberOfMeals, intolerancesAndAllergies, excludedFoods, goalDurationDays, notes } = req.body;

    if (!dietType || !goal || desiredWeight === undefined || numberOfMeals === undefined || goalDurationDays === undefined) {
        throw new ApiError(400, "All fields are required");
    }

    let planJson: any;
    try {
        // Use the LangGraph agent instead of direct LLM call
        const dietPlan = await generateDietPlanWithAgent(
            userDetails[0],
            { dietType, goal, desiredWeight, numberOfMeals, intolerancesAndAllergies, excludedFoods, goalDurationDays, notes }
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


        // --- Extract totals from the "Total" object ---
        const totalObj = planJson.find(
            (row: any) =>
                (row.Total || row.total) &&
                typeof (row.Total || row.total) === "object"
        );
        const totals = totalObj ? (totalObj.Total || totalObj.total) : {};

        if (!totals || Object.keys(totals).length === 0) {
            throw new ApiError(500, "Failed to extract totals from diet plan");
        }

        const newDiet: NewDiet = {
            userId: user.id,
            name: `${goal.replace("_", " ")} Diet Plan`,
            description: `Auto-generated diet plan for ${goal.replace("_", " ")}.`,
            dietType,
            goal,
            goal_duration_days: goalDurationDays,
            intolerancesAndAllergies: intolerancesAndAllergies || null,
            excludedFoods: excludedFoods || null,
            numberOfMeals,
            notes: notes || null,
            plan: planJson,
            totalProtein: totals.protein ? totals.protein : null,
            totalCarbs: totals.carbs ? totals.carbs : null,
            totalFats: totals.fats ? totals.fats : null,
            totalFibers: totals.fibers ? totals.fibers : null,
            totalCalories: totals.calories ? totals.calories : null,
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

        {/*
    setImmediate(async () => {
            try {

                const indexName = "diet-plans";
                const indexes = await pinecone.listIndexes();
                const indexExists = indexes.indexes?.some(idx => idx.name === indexName);

                if (!indexExists) {
                    await pinecone.createIndex({
                        name: indexName,
                        dimension: 1024,
                        metric: "cosine",
                        spec: {
                            serverless: {
                                cloud: "aws",
                                region: "us-east-1"
                            }
                        }
                    });
                    // Wait for index to be ready (shorter, less blocking)
                    let isReady = false, attempts = 0, maxAttempts = 10;
                    while (!isReady && attempts < maxAttempts) {
                        try {
                            await pinecone.Index(indexName).describeIndexStats();
                            isReady = true;
                        } catch {
                            attempts++;
                            await new Promise(res => setTimeout(res, 1000));
                        }
                    }
                    if (!isReady) return;
                }

                const index = pinecone.Index(indexName);
                const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
                    pineconeIndex: index,
                    textKey: "text",
                    namespace: "diet-plans",
                });

                const doc = new Document({
                    pageContent: JSON.stringify(planJson),
                    metadata: {
                        userId: user.id,
                        type: "diet_plan",
                        createdAt: new Date().toISOString(),
                        goal: req.body.goal,
                        dietType: req.body.dietType,
                    }
                });
                const splitter = new RecursiveCharacterTextSplitter({
                    chunkSize: 1000,
                    chunkOverlap: 200,
                });
                const splits = await splitter.splitDocuments([doc]);
                await vectorStore.addDocuments(splits);
            } catch (err) {
                // Optionally log error, but do not affect user response
            }
        });
    */}

    await embedDietPlanQueue.add("embed-diet-plan", {
        planJson,
        userId: user.id,
        goal: req.body.goal,
        dietType: req.body.dietType,
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

    if (!question) {
        throw new ApiError(400, "Question is required");
    }

    // 1. Initialize Pinecone client
    const pinecone = new PineconeClient({
        apiKey: process.env.PINECONE_API_KEY!,
    });

    // 2. Initialize MistralAI embeddings
    const embeddings = new MistralAIEmbeddings({
        apiKey: process.env.MISTRAL_API_KEY!,
        model: "mistral-embed",
    });

    // 3. Prepare vector store
    const indexName = "diet-plans";
    const index = pinecone.Index(indexName);
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: index,
        textKey: "text",
        namespace: "diet-plans",
    });

    // 4. Prepare filter
    const filter: any = {};
    if (user) {
        if (user.id) filter.userId = user.id;
    }

    // 5. Similarity search
    let results;
    try {
        results = await vectorStore.similaritySearch(question, 2, filter);
        results = JSON.parse(JSON.stringify(results))
    } catch (error) {
        console.error("Error querying diet plan:", error);
        throw new ApiError(500, "Error querying diet plan database");
    }

    if (!results || results.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, { context: null, sources: [] }, "No relevant information found in diet plan database")
        );
    }

    const SYSTEM_PROMPT = `You are a helpful AI assistant. You will be provided with some context from a user's diet plan. 
Use this context as a reference to answer the user's question. 
If the answer is not directly available in the context, you can use your own knowledge and expertise to provide a helpful, detailed, and accurate response. 
Feel free to explain concepts, give suggestions, or add extra information even if it is not explicitly mentioned in the context.

Context:
${JSON.stringify(results)}

User Question: ${question}
`;

    const answer = await llm.invoke(SYSTEM_PROMPT)

    // // 6. Build context and sources
    // const context = results.map((doc, idx) =>
    //     `Context ${idx + 1} (${doc.metadata.type}):\n${doc.pageContent}`
    // ).join('\n\n');

    // const sources = results.map(doc => ({
    //     type: doc.metadata.type,
    //     planId: doc.metadata.planId,
    //     createdAt: doc.metadata.createdAt,
    // }));

    return res.status(200).json(
        new ApiResponse(200, { answer }, "Relevant diet plan information found")
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