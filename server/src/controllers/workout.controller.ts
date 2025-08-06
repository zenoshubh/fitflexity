import db from "@/db";
import { users } from "@/db/schemas/user.schema";
import { workouts, type NewWorkout } from "@/db/schemas/workout.schema";
import { generateWorkoutPlanWithLLM } from "@/utils/agents/workoutPlanGenerator";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { managePlanEmbeddingsQueue } from "@/lib/bullmq";
import { eq } from "drizzle-orm";
import { llm } from "@/lib/LLMconfig";
import { initialiseVectorStore } from "@/lib/vectorStore";
import type { Document } from "@langchain/core/documents";
import { duration } from "drizzle-orm/gel-core";


const generateWorkoutPlan = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const { workoutType,
        numberOfDays,
        totalDurationMins,
        experience,
        notes } = req.body;


    if (!workoutType || numberOfDays === undefined || totalDurationMins === undefined || experience === undefined || notes === undefined) {
        throw new ApiError(400, "All fields are required");
    }

    const { gender, heightInCms, currentWeightInKgs, activityLevel, goal, dateOfBirth } = user;


    let planJson: any;
    try {
        // Use the LangGraph agent instead of direct LLM call
        const workoutPlan = await generateWorkoutPlanWithLLM(
            { gender, heightInCms, currentWeightInKgs, activityLevel, dateOfBirth, workoutType, goal, numberOfDays, totalDurationMins, experience, notes }
        );

        if (!workoutPlan) {
            throw new ApiError(500, "Failed to generate workout plan");
        }

        // Convert the AI response to string
        const workoutPlanText = typeof workoutPlan === 'string'
            ? workoutPlan
            : Array.isArray(workoutPlan)
                ? JSON.stringify(workoutPlan)
                : String(workoutPlan);


        // Try to extract JSON from the response (in case model adds extra text)
        const jsonMatch = workoutPlanText.match(/\[.*\]/s);
        const jsonString = jsonMatch ? jsonMatch[0] : workoutPlanText;

        if (!jsonString) {
            throw new ApiError(500, "Failed to parse workout plan response");
        }

        planJson = JSON.parse(jsonString);


        const newWorkout: NewWorkout = {
            userId: user.id,
            name: `${goal?.replace("_", " ")} Workout Plan`,
            description: `Auto-generated workout plan for ${goal?.replace("_", " ")}.`,
            workoutType,
            numberOfDays,
            totalDurationMins,
            experience,
            notes: notes || null,
            plan: planJson,
        }

        // --- Save to DB ---
        const savedWorkout = await db.insert(workouts).values(newWorkout).returning();

        if (!savedWorkout || savedWorkout.length === 0) {
            throw new ApiError(500, "Failed to save workout plan");
        }

        // Respond to user immediately
        res.status(200).json(
            new ApiResponse(200, { plan: planJson }, "Workout plan generated and saved successfully")
        );

        await managePlanEmbeddingsQueue.add("embed-workout-plan", {
            planJson,
            userId: user.id,
            goal: goal,
            planType: "workout",
        });

        return;

    } catch (error) {
        throw new ApiError(500, "Failed to generate or parse workout plan");
    }
})

const fetchWorkoutPlan = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const userId = user.id;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const workoutPlan = await db.select().from(workouts).where(eq(workouts.userId, userId));

    if (workoutPlan.length === 0) {
        throw new ApiError(404, "Workout plan not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { plan: workoutPlan[0]?.plan }, "Workout plan fetched successfully")
    );
})

const getWorkoutPreferences = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const userId = user.id;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const workoutPlan = await db.select({
        workoutType: workouts.workoutType,
        numberOfDays: workouts.numberOfDays,
        experience: workouts.experience,
        totalDurationMins: workouts.totalDurationMins,
        notes: workouts.notes,
    }).from(workouts).where(eq(workouts.userId, userId));

    if (workoutPlan.length === 0 || !workoutPlan[0]) {
        return res.status(200).json(
            new ApiResponse(200, { plan: null }, "No workout plan found for the user")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, {
            workoutType: workoutPlan[0].workoutType,
            numberOfDays: workoutPlan[0].numberOfDays,
            experience: workoutPlan[0].experience,
            totalDurationMins: workoutPlan[0].totalDurationMins,
            notes: workoutPlan[0].notes
        }, "Workout preferences fetched successfully")
    );
})

const editWorkoutPlan = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const userId = user.id;
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const { workout, updateInstruction } = req.body;
    if (!workout || !updateInstruction) {
        throw new ApiError(400, "Both workout and updateInstruction are required");
    }

    // Fetch current workout plan
    const workoutPlanRows = await db.select().from(workouts).where(eq(workouts.userId, userId));
    if (!workoutPlanRows.length) {
        throw new ApiError(404, "Workout plan not found");
    }

    // Add null check for workoutPlanRows[0]
    if (!workoutPlanRows[0] || !workoutPlanRows[0].plan) {
        throw new ApiError(404, "Workout plan data is missing");
    }

    const currentPlan = workoutPlanRows[0].plan as any[];

    // Find the session index in the plan by 'day'
    const sessionIdx = currentPlan.findIndex((row: any) =>
        row.day === workout.day
    );
    if (sessionIdx === -1) {
        throw new ApiError(404, "Workout session not found in workout plan");
    }

    // Prepare LLM prompt for workout session update
    const SYSTEM_PROMPT = `
You are a fitness expert AI. You will be given a workout session (for a day) from a user's workout plan in JSON format and an update instruction from the user.
Update the session according to the instruction, keeping the format and structure the same.
Return ONLY the updated session object in valid JSON.

Session:
${JSON.stringify(workout, null, 2)}

Instruction:
${updateInstruction}
`;

    let updatedSession;
    try {
        const llmResponse = await llm.invoke(SYSTEM_PROMPT);
        // Try to extract JSON from LLM response
        const llmResponseText = llmResponse.content.toString();
        const jsonMatch = llmResponseText.match(/\{[\s\S]*\}/);
        const sessionJson = jsonMatch ? jsonMatch[0] : llmResponseText;
        updatedSession = JSON.parse(sessionJson);
    } catch (err) {
        throw new ApiError(500, "Failed to update workout session using AI");
    }

    // Replace the session in the plan
    const updatedPlan = [...currentPlan];
    updatedPlan[sessionIdx] = updatedSession;

    // Save updated plan to DB
    const updatedWorkout = await db
        .update(workouts)
        .set({ plan: updatedPlan })
        .where(eq(workouts.userId, userId))
        .returning();

    if (!updatedWorkout.length) {
        throw new ApiError(500, "Failed to save updated workout plan");
    }

    return res.status(200).json(
        new ApiResponse(200, { plan: updatedPlan }, "Workout plan updated successfully")
    );
});

const updateWorkoutPlan = asyncHandler(async (req, res) => {

    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    await managePlanEmbeddingsQueue.add("delete-workout-plan", {
        userId: user.id,
        planType: "workout",
    });

    const { currentWeightInKgs, heightInCms, dateOfBirth, goal, activityLevel, gender } = user;

    const workoutPreferences = await db.select({
        workoutType: workouts.workoutType,
        numberOfDays: workouts.numberOfDays,
        totalDurationMins: workouts.totalDurationMins,
        experience: workouts.experience,
        notes: workouts.notes
    }).from(workouts).where(eq(workouts.userId, user.id));

    let planJson: any;
    try {
        const workoutPlan = await generateWorkoutPlanWithLLM(
            {
                gender,
                heightInCms,
                currentWeightInKgs,
                activityLevel,
                dateOfBirth,
                workoutType: workoutPreferences[0]?.workoutType || "full_body",
                goal,
                numberOfDays: workoutPreferences[0]?.numberOfDays || 3,
                totalDurationMins: workoutPreferences[0]?.totalDurationMins || 60,
                experience: workoutPreferences[0]?.experience || "beginner",
                notes: workoutPreferences[0]?.notes || ""
            }
        );

        if (!workoutPlan) {
            throw new ApiError(500, "Failed to generate workout plan");
        }

        // Convert the AI response to string
        const workoutPlanText = typeof workoutPlan === 'string'
            ? workoutPlan
            : Array.isArray(workoutPlan)
                ? JSON.stringify(workoutPlan)
                : String(workoutPlan);


        // Try to extract JSON from the response (in case model adds extra text)
        const jsonMatch = workoutPlanText.match(/\[.*\]/s);
        const jsonString = jsonMatch ? jsonMatch[0] : workoutPlanText;

        if (!jsonString) {
            throw new ApiError(500, "Failed to parse workout plan response");
        }

        planJson = JSON.parse(jsonString);


        const newWorkout: Partial<NewWorkout> = {
            name: `${goal?.replace("_", " ")} Workout Plan`,
            description: `Auto-generated workout plan for ${goal?.replace("_", " ")}.`,
            plan: planJson,
            updatedAt: new Date(),
        };

        // --- Save to DB ---
        const savedWorkout = await db
            .update(workouts)
            .set(newWorkout)
            .where(eq(workouts.userId, user.id))
            .returning({ id: workouts.id });

        if (!savedWorkout || savedWorkout.length === 0) {
            throw new ApiError(500, "Failed to save workout plan");
        }

        // Respond to user immediately
        res.status(200).json(
            new ApiResponse(200, { plan: planJson }, "Workout plan updated and saved successfully")
        );

        await managePlanEmbeddingsQueue.add("embed-workout-plan", {
            planJson,
            userId: user.id,
            goal: goal,
            planType: "workout",
        });

        return;

    } catch (error) {
        throw new ApiError(500, "Failed to generate or parse workout plan");
    }
})

const chatWorkoutPlan = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const { question } = req.body;



    if (!question) {
        throw new ApiError(400, "Question is required");
    }

    const vectorStore = await initialiseVectorStore({
        collectionName: "workout-plans"
    });

    // 4. Prepare filter
    let filter: any = {};
    if (user && user.id) {
        // Qdrant expects filter as { must: [{ key: "...", match: { value: ... } }] }
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
        console.error("Error querying workout plan:", error);
        // Qdrant 400 error: return empty result instead of throwing
        return res.status(200).json(
            new ApiResponse(200, { context: null, sources: [] }, "No relevant information found in workout plan database")
        );
    }

    if (!results || results.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, { context: null, sources: [] }, "No relevant information found in workout plan database")
        );
    }

    const SYSTEM_PROMPT = `You are a helpful Fitness assistant. You will be provided with some context from a user's workout plan. 
Use this context as a reference to answer the user's question. 
If the answer is not directly available in the context, you can use your own fitness knowledge and expertise to provide a helpful, detailed, and accurate response. 
Feel free to explain concepts, give suggestions, or add extra information even if it is not explicitly mentioned in the context. In case if user question is not related to workout plan, politely inform them that you can only answer questions related to their workout plan and general fitness. 
You can answer exercise routines also.
IMPORTANT: Reply in less than 200 words. 

Context:
${JSON.stringify(results)}

User Question: ${question}
`;

    let answer = await llm.invoke(SYSTEM_PROMPT)
    const answerText = answer.content.toString();
    return res.status(200).json(
        new ApiResponse(200, { answer: answerText }, "Relevant workout plan information found")
    );
})

const deleteWorkoutPlan = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    const userId = user.id;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const workoutPlan = await db.select().from(workouts).where(eq(workouts.userId, userId));

    if (workoutPlan.length === 0) {
        throw new ApiError(404, "Workout plan not found");
    }

    await db.delete(workouts).where(eq(workouts.userId, userId));

    res.status(200).json(
        new ApiResponse(200, {}, "Workout plan deleted successfully")
    );

    await managePlanEmbeddingsQueue.add("delete-workout-plan", {
        userId: user.id,
        planType: "workout",
    });
})

export {
    generateWorkoutPlan,
    fetchWorkoutPlan,
    getWorkoutPreferences,
    editWorkoutPlan,
    updateWorkoutPlan,
    chatWorkoutPlan,
    deleteWorkoutPlan
};