"use client";
import Loader from "@/components/Loader";
import withAuth from "@/components/withAuth";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import WeightLog from "@/components/WeightLog";
import UserSummaryCard from "@/components/UserSummaryCard";

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
    <div className="flex flex-col items-center justify-center">
      <UserSummaryCard
        currentWeight={
          typeof currentWeight === "string"
            ? parseFloat(currentWeight)
            : currentWeight
        }
      />
      <WeightLog onWeightLogged={setCurrentWeight} />
    </div>
  );
};

export default withAuth(Dashboard);
