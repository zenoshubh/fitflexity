"use client";

import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import React from "react";
import ViewWorkoutPlanPage from "@/components/ViewWorkoutPlan";
import CreateWorkoutPlanPage from "@/components/CreateWorkoutPlan";

const WorkoutPage = () => {
  const { user } = useAuth();
  return user?.hasWorkoutPlan ? (
    <ViewWorkoutPlanPage />
  ) : (
    <CreateWorkoutPlanPage />
  );
};

export default withAuth(WorkoutPage);
