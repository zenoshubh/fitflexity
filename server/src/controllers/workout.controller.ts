import db from "@/db";
import { users } from "@/db/schemas/user.schema";
import { workouts, type NewWorkout } from "@/db/schemas/workout.schema";
import { generateWorkoutPlanWithLLM } from "@/utils/agents/workoutPlanGenerator";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { queue as embedWorkoutPlanQueue } from "@/lib/bullmq";
import { eq } from "drizzle-orm";


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

    const { gender, heightInCms, weightInKgs, activityLevel, goal , dateOfBirth } = user;


    let planJson: any;
    try {
        // Use the LangGraph agent instead of direct LLM call
        const workoutPlan = await generateWorkoutPlanWithLLM(
            { gender, heightInCms, weightInKgs, activityLevel, dateOfBirth, workoutType, goal, numberOfDays, totalDurationMins, experience, notes }
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

        // --- Offload vector DB indexing to background ---

        await embedWorkoutPlanQueue.add("embed-plan", {
            planJson,
            userId: user.id,
            goal: goal,
            planType: "workout",
        });

        // Return here so no further code runs in this handler
        return;

    } catch (error) {
        throw new ApiError(500, "Failed to generate or parse diet plan");
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

const updateWorkoutPlan = asyncHandler(async (req, res) => {})

const chatWorkoutPlan = asyncHandler(async (req, res) => { })

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

    return res.status(200).json(
        new ApiResponse(200, {}, "Workout plan deleted successfully")
    );
})

export { generateWorkoutPlan, fetchWorkoutPlan, updateWorkoutPlan, chatWorkoutPlan, deleteWorkoutPlan };