import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import db from "@/db";
import { users } from "@/db/schemas/user.schema";
import { ApiError } from "@/utils/ApiError";
import { asyncHandler } from "@/utils/asyncHandler";

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
            .select()
            .from(users)
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
