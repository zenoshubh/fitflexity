import type { NextFunction, Request, Response } from "express";


const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || []
    });
}

export default errorMiddleware;