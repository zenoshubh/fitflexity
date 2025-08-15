"use client";

import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import React from "react";
import ViewDietPlanPage from "@/components/ViewDietPlan";
import CreateDietPlanPage from "@/components/CreateDietPlan";


const DietPage = () => {
  const { user } = useAuth();
  return user?.hasDietPlan ? <ViewDietPlanPage /> : <CreateDietPlanPage />;
};

export default withAuth(DietPage);
