import db from "@/db";
import { weightLogs } from "@/db/schemas/weightLog.schema";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { desc, eq } from "drizzle-orm";
import { date } from "drizzle-orm/mysql-core";

const addWeightLog = asyncHandler(async (req, res) => {
  const user = req.user; // Assuming user is set in middleware
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const { weightInKgs } = req.body;

  // Validate request data
  if (!user.id || !weightInKgs) {
    throw new ApiError(400, "All fields are required");
  }

  // Log weight to the database
  const newWeightLog = await db.insert(weightLogs).values({
    userId: user.id,
    weightInKgs: weightInKgs,
  }).returning();
  if (!newWeightLog) {
    throw new ApiError(500, "Failed to log weight");
  }

  return res.status(201).json(
    new ApiResponse(200, { newWeightLog: newWeightLog[0] }, "Weight log created successfully")
  );

});

const fetchWeightLogs = asyncHandler(async (req, res) => {
  const user = req.user; // Assuming user is set in middleware
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const logs = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, user.id))
    .orderBy(desc(weightLogs.date));

  if (!logs || logs.length === 0) {
    return res.status(404).json(new ApiResponse(404, {}, "No weight logs found"));
  }

  return res.status(200).json(new ApiResponse(200, { logs }, "Weight logs fetched successfully"));
});

export { addWeightLog, fetchWeightLogs };