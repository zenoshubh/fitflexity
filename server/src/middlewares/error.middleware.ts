import { ApiError } from "@/utils/ApiError";
import type { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // If it's an instance of your custom ApiError
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors,
            data: err.data,
        });
    }

    // Else handle other unexpected errors
    console.error("Unexpected Error:", err);

    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errors: [],
        data: null,
    });
};
