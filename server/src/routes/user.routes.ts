import { Router } from "express";
import { authenticateUserWithGoogle, completeProfile, getCurrentUser, initiateGoogleAuth, logoutUser, refreshAccessToken, updateProfile } from "@/controllers/user.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";

const router = Router()

// Public routes
router.route("/auth/google").get(initiateGoogleAuth);
router.route("/auth/google/callback").get(authenticateUserWithGoogle);
router.route("/refresh-token").post(refreshAccessToken);

// Protected routes
router.route("/complete-profile").post(verifyJWT, completeProfile);
router.route("/update-profile").put(verifyJWT, updateProfile);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);


export default router