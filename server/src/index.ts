import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app: Express = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ROUTES
import userRouter from "./routes/user.routes";
import dietRouter from "./routes/diet.routes";
import errorMiddleware from "./middlewares/error.middleware";

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/diet", dietRouter)

// Error handling middleware
app.use(errorMiddleware);

const PORT: number = parseInt(process.env.PORT || "8000", 10);

app.listen(PORT, () => {
    console.log(`🚀 Server is running at port ${PORT}`);
});
