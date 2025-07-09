import { chatDietPlan, generateDietPlan } from "@/controllers/diet.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router()

router.route("/generate-diet-plan").post(verifyJWT, generateDietPlan)
router.route("/chat-diet-plan").post(verifyJWT , chatDietPlan)

export default router;