import { addWeightLog , fetchWeightLogs } from "@/controllers/weightLog.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router()

router.route("/add-weight-log").post(verifyJWT, addWeightLog)
router.route("/fetch-weight-logs").get(verifyJWT, fetchWeightLogs);

export default router;