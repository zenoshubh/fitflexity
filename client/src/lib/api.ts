// lib/api.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import isPublicRoute from "./PUBLIC_ROUTES";

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
    _retry?: boolean;
}
const getCurrentPath = () => {
    if (typeof window === "undefined") return "";
    return window.location.pathname;
};
const api: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
    withCredentials: true,
});

// Interceptor
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("/users/refresh-token")
        ) {
            originalRequest._retry = true;

            try {
                await api.post("/users/refresh-token");
                return api(originalRequest);
            } catch (refreshErr) {
                // ✅ Redirect ONLY if user is on private route
                if (!isPublicRoute(getCurrentPath()) && typeof window !== "undefined") {
                    console.error("🔁 Refresh token failed:", refreshErr);

                    window.location.href = "/";
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
