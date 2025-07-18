import { llm } from "@/lib/llm";

export const generateWorkoutPlanWithLLM = async ({
    gender,
    heightInCms,
    weightInKgs,
    activityLevel,
    dateOfBirth,
    workoutType,
    goal,
    numberOfDays,
    totalDurationMins,
    experience,
    notes
}: any) => {

    // Calculate age from dateOfBirth
    const age = dateOfBirth ? new Date().getFullYear() - new Date(dateOfBirth).getFullYear() : 30; // Default age of 30 if not provided

    const WORKOUT_PLAN_PROMPT = `Generate a detailed workout plan for a user based on the following requirements:

    - Gender: ${gender}
    - Height (cm): ${heightInCms}
    - Weight (kg): ${weightInKgs}
    - Activity Level: ${activityLevel}
    - Age: ${age}
    - Workout Type: ${workoutType}
    - Goal: ${goal}
    - Number of Days per week: ${numberOfDays}
    - Total Duration (mins): ${totalDurationMins}
    - Experience Level: ${experience}
    - Notes: ${notes}

    Return a JSON array of workout sessions, each with the following structure:
    {
        "day": "Monday",
        "exercises": [
            {
                "name": "Push-up",
                "sets": 3,
                "reps": 10
            },
            ...
        ]
    }

    - Do NOT include any extra text, explanation, or markdown. Only output the JSON array as shown above.
    `;

    const result = await llm.invoke(WORKOUT_PLAN_PROMPT);

    return result.content;
}

