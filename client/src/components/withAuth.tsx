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

      if (!user?.isProfileComplete && isAuthenticated) {
        router.replace("/complete-profile");
      }
    }, [loading, isAuthenticated, router]);

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  return ComponentWithAuth;
};

export default withAuth;
