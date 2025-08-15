"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { FC } from "react";

const withAuth = <P extends object>(WrappedComponent: FC<P>): FC<P> => {
  const ComponentWithAuth: FC<P> = (props) => {
    const { isAuthenticated, loading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.replace("/");
      }

      if (!loading && isAuthenticated && !user?.isProfileComplete) {
        router.replace("/complete-profile");
      }
    }, [loading, isAuthenticated, user, router]);

    // Jab tak loading true hai, kuch bhi render na karo
    if (loading) {
      return null; // Ya <Loader /> agar loader dikhana chahte ho
    }

    if (!isAuthenticated) {
      return null;
    }

    if (!user?.isProfileComplete && typeof window !== "undefined" && window.location.pathname !== "/complete-profile") {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  return ComponentWithAuth;
};

export default withAuth;
