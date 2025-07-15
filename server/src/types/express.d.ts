import type { User } from "@/db/schemas/user.schema";

declare global {
    namespace Express {
        interface Request {
            user?: Pick<User, "id" | "firstName" | "email" | "dateOfBirth" | "weightInKgs" | "heightInCms" | "isProfileComplete">;
        }
    }
}