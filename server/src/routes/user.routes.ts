import { Router } from "express";
import { authenticateUserWithGoogle, getCurrentUser, initiateGoogleAuth, logoutUser, refreshAccessToken } from "@/controllers/user.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";

const router = Router()

// Public routes
router.route("/auth/google").get(initiateGoogleAuth);
router.route("/auth/google/callback").get(authenticateUserWithGoogle);
router.route("/refresh-token").post(refreshAccessToken);

// Protected routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);

export default router