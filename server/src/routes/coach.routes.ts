import { chatCoach } from "@/controllers/coach.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router()

router.route("/chat").post(verifyJWT,chatCoach)
    

export default router;