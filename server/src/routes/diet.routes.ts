import { chatDietPlan, deleteDietPlan, fetchDietPlan, generateDietPlan, editDietPlan, updateDietPlan } from "@/controllers/diet.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router()

router.route("/generate-diet-plan").post(verifyJWT, generateDietPlan)
router.route("/chat-diet-plan").post(verifyJWT, chatDietPlan)
router.route("/get-diet-plan").get(verifyJWT, fetchDietPlan)
router.route("/edit-diet-plan").put(verifyJWT, editDietPlan)
router.route("/delete-diet-plan").delete(verifyJWT, deleteDietPlan)
router.route("/update-diet-plan").put(verifyJWT, updateDietPlan) 

export default router;