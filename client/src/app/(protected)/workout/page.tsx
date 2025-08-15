"use client";

import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import React from "react";
import ViewWorkoutPlanPage from "@/components/ViewWorkoutPlan";
import CreateWorkoutPlanPage from "@/components/CreateWorkoutPlan";
import { useSearchParams } from "next/navigation";

const WorkoutPage = () => {
  const { user } = useAuth();

  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  if (mode === "update") {
    return <CreateWorkoutPlanPage />;
  }

  return user?.hasWorkoutPlan ? (
    <ViewWorkoutPlanPage />
  ) : (
    <CreateWorkoutPlanPage />
  );
};

export default withAuth(WorkoutPage);
