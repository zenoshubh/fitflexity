import { eq } from "drizzle-orm";
import axios from "axios";
import jwt, { type SignOptions } from "jsonwebtoken";
import db from "@/db";
import { users, type NewUser } from "@/db/schemas/user.schema";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { date } from "drizzle-orm/mysql-core";

// Helper function to generate access and refresh tokens
const generateTokens = (userId: string) => {
    const accessTokenOptions: SignOptions = {
        expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRY!) as jwt.SignOptions['expiresIn'] || '15m'
    };

    const accessToken = jwt.sign(
        { userId },
        process.env.ACCESS_TOKEN_SECRET!,
        accessTokenOptions
    );

    const refreshTokenOptions: SignOptions = {
        expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRY!) as jwt.SignOptions['expiresIn'] || '7d'
    };

    const refreshToken = jwt.sign(
        { userId },
        process.env.REFRESH_TOKEN_SECRET!,
        refreshTokenOptions
    );

    return { accessToken, refreshToken };
};

// Define interfaces for Google OAuth responses
interface GoogleTokenResponse {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    token_type?: string;
    expires_in?: number;
}

interface GoogleUserInfo {
    id: string;
    email: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    verified_email?: boolean;
}

const initiateGoogleAuth = asyncHandler(async (req, res) => {
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const REDIRECT_URI = `${process.env.BASE_URL}/users/auth/google/callback`;

    if (!CLIENT_ID) {
        throw new ApiError(500, "Google OAuth configuration missing");
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile&` +
        `access_type=offline&` +
        `prompt=consent`;

    return res.redirect(authUrl);
});

const authenticateUserWithGoogle = asyncHandler(async (req, res) => {
    const CLIENT_ID: string | undefined = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET: string | undefined = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI: string = `${process.env.BASE_URL}/users/auth/google/callback`;

    // Validate environment variables
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new ApiError(500, "Google OAuth configuration missing");
    }

    const code: string | undefined = req.query.code as string;

    // Validate authorization code
    if (!code) {
        throw new ApiError(400, "Authorization code is required");
    }

    try {

        // 1️⃣ Exchange code for token
        const tokenResponse = await axios.post<GoogleTokenResponse>(`https://oauth2.googleapis.com/token`, {
            code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
        });

        const { access_token } = tokenResponse.data;

        // 2️⃣ Get user info using access_token
        const userInfo = await axios.get<GoogleUserInfo>(`https://www.googleapis.com/oauth2/v2/userinfo`, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const user: GoogleUserInfo = userInfo.data;

        // Check if user already exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

        let userData;

        if (existingUser.length > 0) {
            userData = existingUser[0]!; // Non-null assertion as we've checked length > 0
        } else {
            // Create new user
            const newUser: NewUser = {
                firstName: user.given_name || user.name?.split(' ')[0] || 'Unknown',
                lastName: user.family_name || user.name?.split(' ')[1] || 'User',
                email: user.email.toLowerCase(),
                isProfileComplete: false, // Default to false, can be updated later
                googleId: user.id,
            };

            const createdUser = await db
                .insert(users)
                .values(newUser)
                .returning({
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email,
                    dateOfBirth: users.dateOfBirth,
                    isProfileComplete: users.isProfileComplete,
                    googleId: users.googleId,
                    refreshToken: users.refreshToken,
                    createdAt: users.createdAt,
                    updatedAt: users.updatedAt,
                });

            if (!createdUser[0]) {
                throw new ApiError(500, "Failed to create user");
            }

            userData = createdUser[0];
        }

        // Ensure userData exists
        if (!userData) {
            throw new ApiError(500, "Failed to retrieve or create user data");
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(userData.id);

        // Update refresh token in database
        await db
            .update(users)
            .set({ refreshToken })
            .where(eq(users.id, userData.id));

        // Set cookies
        const cookieOptions: {
            httpOnly: boolean;
            secure: boolean;
            sameSite: 'lax';
            maxAge?: number;
        } = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
        };

        res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRY!) * 1000 }); // 15 minutes
        res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY!) * 1000 }); // 7 days

        // 3️⃣ Redirect to frontend
        if (userData.isProfileComplete) {
            return res.redirect(`${process.env.CLIENT_URL}/user/dashboard`);
        } else {
            return res.redirect(`${process.env.CLIENT_URL}/user/complete-profile`);
        }
    } catch (err: any) {
        console.error("Google signup error details:", {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
            config: err.config ? {
                url: err.config.url,
                method: err.config.method
            } : null
        });

        if (err.response?.status === 400) {
            throw new ApiError(400, "Invalid authorization code or OAuth configuration");
        }

        throw new ApiError(500, `Google signup failed: ${err.message}`);
    }
});

const completeProfile = asyncHandler(async (req, res) => {
    const { dateOfBirth, gender, weightInKgs, targetWeightInKgs, heightInCms, activityLevel, goal } = req.body;

    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (!dateOfBirth || !gender || !weightInKgs || !heightInCms || !activityLevel || !goal || !targetWeightInKgs) {
        throw new ApiError(400, "All fields are required to complete the profile");
    }

    // Update user profile
    const updatedUser = await db
        .update(users)
        .set({
            dateOfBirth,
            gender,
            initialWeightInKgs: weightInKgs,
            currentWeightInKgs: weightInKgs,
            lastUpdatedWeightInKgs: weightInKgs,
            targetWeightInKgs,
            heightInCms,
            activityLevel,
            goal,
            isProfileComplete: true
        })
        .where(eq(users.id, req.user.id))
        .returning({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            dateOfBirth: users.dateOfBirth,
            isProfileComplete: users.isProfileComplete,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
        });

    if (!updatedUser[0]) {
        throw new ApiError(500, "Failed to update user profile");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Profile completed successfully"));
})

const updateProfile = asyncHandler(async (req, res) => {
    const { dateOfBirth, gender, heightInCms, activityLevel, goal, lastUpdatedWeightInKgs, updateRequired } = req.body;

    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    // Only require at least one field to update (allow boolean false for updateRequired)
    if (
        activityLevel === undefined &&
        goal === undefined &&
        dateOfBirth === undefined &&
        gender === undefined &&
        heightInCms === undefined &&
        lastUpdatedWeightInKgs === undefined &&
        updateRequired === undefined
    ) {
        throw new ApiError(400, "At least one field is required to update");
    }

    const updateData: Record<string, any> = {};
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (heightInCms !== undefined) updateData.heightInCms = heightInCms;
    if (activityLevel !== undefined) updateData.activityLevel = activityLevel;
    if (goal !== undefined) updateData.goal = goal;
    if (lastUpdatedWeightInKgs !== undefined) updateData.lastUpdatedWeightInKgs = lastUpdatedWeightInKgs;
    if (updateRequired !== undefined) updateData.updateRequired = updateRequired;

    // Update user profile
    const updatedUser = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, req.user.id))
        .returning({
            id: users.id,
        });

    if (!updatedUser[0]) {
        throw new ApiError(500, "Failed to update user profile");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Profile updated successfully"));
})

const getCurrentUser = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }
    return res.status(200).json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
        // Remove refresh token from database
        await db
            .update(users)
            .set({ refreshToken: null })
            .where(eq(users.refreshToken, refreshToken));
    }

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    return res.status(200).json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET!
        ) as { userId: string };

        const user = await db
            .select()
            .from(users)
            .where(eq(users.id, decodedToken.userId))
            .limit(1);

        if (!user.length) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const userData = user[0];

        if (!userData) {
            throw new ApiError(401, "User data not found");
        }

        if (incomingRefreshToken !== userData.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        // Generate new tokens (token rotation)
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(userData.id);

        // Update refresh token in database
        await db
            .update(users)
            .set({ refreshToken: newRefreshToken })
            .where(eq(users.id, userData.id));

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
        };

        res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: process.env.ACCESS_TOKEN_EXPIRY ? parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000 : 15 * 60 * 1000 }); // 15 minutes
        res.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: process.env.REFRESH_TOKEN_EXPIRY ? parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000 : 7 * 24 * 60 * 60 * 1000 }); // 7 days

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error: any) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

export {
    initiateGoogleAuth,
    authenticateUserWithGoogle,
    completeProfile,
    updateProfile,
    getCurrentUser,
    logoutUser,
    refreshAccessToken
};