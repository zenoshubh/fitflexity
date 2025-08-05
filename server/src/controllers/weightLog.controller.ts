import db from "@/db";
import { users } from "@/db/schemas/user.schema";
import { weightLogs } from "@/db/schemas/weightLog.schema";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { desc, eq } from "drizzle-orm";

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

  let notification = {};

  // If weight difference <= 0.5, set goal to maintain_weight
  let updateObj: Partial<typeof users.$inferInsert> = {
    currentWeightInKgs: weightInKgs,
    updatedAt: new Date(),
  };

  if (
    Math.abs(weightInKgs - Number(user.targetWeightInKgs)) <= 0.5 &&
    user.goal !== "maintain_weight"
  ) {

    updateObj.updateRequired = true; // Set updateRequired to true

    notification = {
      message: "You are close to your target weight! Consider maintaining your current weight. Update your goal to maintenance and adjust your fitness plan accordingly.",
      action : "update",
    };
  }

  if (Math.abs(weightInKgs - Number(user.lastUpdatedWeightInKgs)) > 2) {

    // If weight difference is >= 2, set updateRequired to true
    updateObj.updateRequired = true;

    notification = {
      message: `Your weight has changed significantly by ${Math.abs(weightInKgs - Number(user.lastUpdatedWeightInKgs))} kg. Consider updating your fitness plan.`,
      action: "update",
    };
  }

    await db.update(users).set(updateObj).where(eq(users.id, user.id));

    // Log weight to the database
    const newWeightLog = await db.insert(weightLogs).values({
      userId: user.id,
      weightInKgs: weightInKgs,
    }).returning();
    if (!newWeightLog) {
      throw new ApiError(500, "Failed to log weight");
    }

    return res.
      status(201).
      json(
        new ApiResponse(200,
          {
            newWeightLog: newWeightLog[0],
            notification: notification
          },
          "Weight log created successfully")
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