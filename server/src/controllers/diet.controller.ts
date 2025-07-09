import db from "@/db";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { eq } from "drizzle-orm";
import { users, type User } from "@/db/schemas/user.schema";
import { callGenAI } from "@/lib/LLM";
import { diets, type NewDiet } from "@/db/schemas/diet.schema";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";


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

    let planJson: any;
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


        // --- Extract totals from the "Total" object ---
        const totalObj = planJson.find(
            (row: any) =>
                (row.Total || row.total) &&
                typeof (row.Total || row.total) === "object"
        );
        const totals = totalObj ? (totalObj.Total || totalObj.total) : {};


        const newDiet: NewDiet = {
            userId: user.id,
            name: `${goal.replace("_", " ")} Diet Plan`,
            description: `Auto-generated diet plan for ${goal.replace("_", " ")}.`,
            dietType,
            goal,
            plan: planJson,
            totalProtein: totals.protein ? totals.protein : null,
            totalCarbs: totals.carbs ? totals.carbs : null,
            totalFats: totals.fats ? totals.fats : null,
            totalFibers: totals.fibers ? totals.fibers : null,
            totalCalories: totals.calories ? totals.calories : null,
        }

        // --- Save to DB ---
        const savedDiet = await db.insert(diets).values(newDiet).returning();


        // Respond to user immediately
        res.status(200).json(
            new ApiResponse(200, { plan: planJson }, "Diet plan generated and saved successfully")
        );


        // --- Offload vector DB indexing to background ---
        setImmediate(async () => {
            try {
                const pinecone = new PineconeClient({
                    apiKey: process.env.PINECONE_API_KEY!,
                });

                const embeddings = new MistralAIEmbeddings({
                    apiKey: process.env.MISTRAL_API_KEY!,
                    model: "mistral-embed",
                });

                const indexName = "diet-plans-index";
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

        // Return here so no further code runs in this handler
        return;

    } catch (error) {
        throw new ApiError(500, "Failed to generate or parse diet plan");
    }
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
    const indexName = "diet-plans-index";
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

    const answer = await callGenAI(SYSTEM_PROMPT)

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

export { generateDietPlan, chatDietPlan };