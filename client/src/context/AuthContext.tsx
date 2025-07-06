"use client";

import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
  type FC,
} from "react";
import api from "@/lib/api";
import { AuthContextType, User } from "@/types/user";
import Loader from "@/components/Loader";
import { usePathname } from "next/navigation";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const pathname = usePathname();

  const isPublicRoute = ["/login", "/"].includes(pathname); // Add more if needed

  const fetchCurrentUser = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await api.get("/users/current-user");

      if (response.data?.success && response.data?.data) {
        setUser(response.data.data as User);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (): void => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      console.error("NEXT_PUBLIC_API_URL is not defined.");
      return;
    }

    window.location.href = `${baseUrl}/users/auth/google`;
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post("/users/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = "/";
    }
  };

  useEffect(() => {
    // Fetch current user only if not on public routes
    if (!isPublicRoute) {
      fetchCurrentUser();
    } else {
      setLoading(false);
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
  };

  return loading ? (
    <Loader />
  ) : (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
