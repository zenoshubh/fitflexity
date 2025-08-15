"use client";

import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import React from "react";
import ViewDietPlanPage from "@/components/ViewDietPlan";
import CreateDietPlanPage from "@/components/CreateDietPlan";
import { useSearchParams } from "next/navigation";

const DietPage = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  if (mode === "update") {
    return <CreateDietPlanPage />;
  }

  return user?.hasDietPlan ? <ViewDietPlanPage /> : <CreateDietPlanPage />;
};

export default withAuth(DietPage);
