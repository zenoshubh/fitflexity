import { chatCoach } from "@/controllers/coach.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router()

router.route("/chat").post(chatCoach)


export default router;