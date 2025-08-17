import type { users } from "@/db/schemas/user.schema";

declare global {
    namespace Express {
        interface Request {
            user?: typeof users.$inferSelect & {
                hasDietPlan: boolean;
                hasWorkoutPlan: boolean;
            };
        }
    }
}