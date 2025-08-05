import jwt from "jsonwebtoken";
import { eq, sql } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import db from "@/db";
import { users } from "@/db/schemas/user.schema";
import { ApiError } from "@/utils/ApiError";
import { asyncHandler } from "@/utils/asyncHandler";
import { diets } from "@/db/schemas/diet.schema";
import { workouts } from "@/db/schemas/workout.schema";

interface JwtPayload {
    userId: string;
}

export const verifyJWT = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }


        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as JwtPayload;

        const user = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                dateOfBirth: users.dateOfBirth,
                gender: users.gender,
                isProfileComplete: users.isProfileComplete,
                googleId: users.googleId,
                refreshToken: users.refreshToken,
                initialWeightInKgs: users.initialWeightInKgs,
                currentWeightInKgs: users.currentWeightInKgs,
                lastUpdatedWeightInKgs: users.lastUpdatedWeightInKgs,
                targetWeightInKgs: users.targetWeightInKgs,
                heightInCms: users.heightInCms,
                bodyFatPercentage: users.bodyFatPercentage,
                activityLevel: users.activityLevel,
                goal: users.goal,
                updateRequired: users.updateRequired,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                hasDietPlan: sql<boolean>`CASE WHEN ${diets.userId} IS NOT NULL THEN TRUE ELSE FALSE END`,
                hasWorkoutPlan: sql<boolean>`CASE WHEN ${workouts.userId} IS NOT NULL THEN TRUE ELSE FALSE END`,
            })
            .from(users)
            .leftJoin(diets, eq(users.id, diets.userId))
            .leftJoin(workouts, eq(users.id, workouts.userId))
            .where(eq(users.id, decodedToken.userId))
            .limit(1);

        if (!user.length) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user[0];
        next();

    } catch (error: any) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});
