"use client";
import Loader from "@/components/Loader";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import WeightLog from "@/components/DashboardPage/WeightLog";
import UserSummaryCard from "@/components/DashboardPage/UserSummaryCard";

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [currentWeight, setCurrentWeight] = useState(
    user?.currentWeightInKgs ?? 72
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setCurrentWeight(user?.currentWeightInKgs ?? 72);
  }, [user?.currentWeightInKgs]);

  if (!isAuthenticated || !user) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col items-center justify-center pt-8">
      <UserSummaryCard
        currentWeight={
          typeof currentWeight === "string"
            ? parseFloat(currentWeight)
            : currentWeight
        }
      />
      <div className="h-8" /> {/* Add vertical space between components */}
      <WeightLog onWeightLogged={setCurrentWeight} />
    </div>
  );
};

export default withAuth(Dashboard);
