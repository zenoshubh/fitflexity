import { generateDietPlan } from "@/controllers/diet.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router()

router.route("/generate-diet-plan").post(verifyJWT, generateDietPlan)

export default router;