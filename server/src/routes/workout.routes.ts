import { chatWorkoutPlan, deleteWorkoutPlan, fetchWorkoutPlan, generateWorkoutPlan, editWorkoutPlan, updateWorkoutPlan, getWorkoutPreferences } from "@/controllers/workout.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router()

router.route("/generate-workout-plan").post(verifyJWT, generateWorkoutPlan)
router.route("/chat-workout-plan").post(verifyJWT, chatWorkoutPlan)
router.route("/get-workout-plan").get(verifyJWT, fetchWorkoutPlan)
router.route("/get-workout-preferences").get(verifyJWT, getWorkoutPreferences)
router.route("/edit-workout-plan").put(verifyJWT, editWorkoutPlan)
router.route("/update-workout-plan").put(verifyJWT, updateWorkoutPlan)
router.route("/delete-workout-plan").delete(verifyJWT, deleteWorkoutPlan)


export default router ;