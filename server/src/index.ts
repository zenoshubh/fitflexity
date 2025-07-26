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
import workoutRouter from "./routes/workout.routes";
import weightLogRouter from "./routes/weightLog.routes";
import coachRouter from "./routes/coach.routes";
// Error handling middleware
import errorMiddleware from "./middlewares/error.middleware";

// routes declaration
app.use("/users", userRouter);
app.use("/diet", dietRouter);
app.use("/workout", workoutRouter);
app.use("/weight-log", weightLogRouter);
app.use("/coach", coachRouter);

// Error handling middleware
app.use(errorMiddleware);

const PORT: number = parseInt(process.env.PORT || "8000", 10);

app.listen(PORT, () => {
    console.log(`🚀 Server is running at port ${PORT}`);
});
