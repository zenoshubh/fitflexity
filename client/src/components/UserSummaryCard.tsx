import { useAuth } from "@/hooks/useAuth";
import React, { useState } from "react";
import { Badge } from "./ui/badge";
import UpdatePopup from "./UpdatePopup";
import { Sparkles, Dumbbell, HeartPulse } from "lucide-react";

const activityLevelLabels: Record<string, string> = {
  sedentary: "Sedentary",
  lightly_active: "Lightly Active",
  moderately_active: "Moderately Active",
  very_active: "Very Active",
  super_active: "Super Active",
};

const goalLabels: Record<string, string> = {
  maintain_weight: "Maintain Weight",
  mild_weight_loss_0_25kg_per_week: "Lose 0.25kg/week",
  weight_loss_0_5kg_per_week: "Lose 0.5kg/week",
  extreme_weight_loss_1kg_per_week: "Lose 1kg/week",
  mild_weight_gain_0_25kg_per_week: "Gain 0.25kg/week",
  weight_gain_0_5kg_per_week: "Gain 0.5kg/week",
  extreme_weight_gain_1kg_per_week: "Gain 1kg/week",
};

const UserSummaryCard = ({ currentWeight }: { currentWeight: number }) => {
  const { user, refetch } = useAuth();
  const [showPopup, setShowPopup] = useState(false);

  const goals = [
    { label: "Lose 5 kg", progress: 40 },
    { label: "Run 5K", progress: 70 },
  ];

  const handleBadgeClick = () => {
    setShowPopup(true);
  };

  return (
    <div
      className="relative w-full max-w-5xl mx-auto bg-[#fffefc] border border-orange-100 rounded-3xl shadow-2xl p-5 sm:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 glassmorphism overflow-hidden"
      style={{
        minWidth: 0,
      }}
    >
      {/* Decorative icons */}
      <Dumbbell
        className="absolute left-4 top-8 opacity-10 text-orange-500 hidden sm:block"
        size={40}
      />
      <HeartPulse
        className="absolute right-6 top-16 opacity-10 text-orange-500 hidden sm:block"
        size={32}
      />
      <Sparkles
        className="absolute left-1/2 top-2 opacity-20 text-orange-500"
        size={18}
      />
      <Sparkles
        className="absolute right-2 bottom-2 opacity-20 text-orange-500"
        size={18}
      />

      {/* Avatar & Welcome */}
      <div className="flex flex-col items-center md:items-start gap-3 flex-1 min-w-[180px]">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-orange-500 to-orange-700 flex items-center justify-center shadow-lg mb-2 border-4 border-white">
          <span className="text-3xl sm:text-4xl font-bold text-white">
            {user?.firstName?.[0] ?? "U"}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 text-center md:text-left leading-tight">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-orange-500 to-orange-700 bg-clip-text text-transparent">
            {user?.firstName}!
          </span>
        </h1>
        <div className="text-gray-500 text-base md:text-lg text-center md:text-left mt-1">
          {user?.updateRequired && (
            <Badge
              variant="destructive"
              className="cursor-pointer ml-2"
              onClick={handleBadgeClick}
            >
              Plan Update Needed
            </Badge>
          )}
        </div>
        <div className="mt-2 text-orange-700 text-sm font-medium text-center md:text-left">
          {user?.isProfileComplete
            ? "Your fitness journey is in progress. Keep pushing forward!"
            : "Complete your profile to unlock personalized plans."}
        </div>
      </div>

      {/* Stats & Info */}
      <div className="flex flex-col gap-4 sm:gap-6 flex-1 w-full min-w-[220px]">
        <div className="flex flex-row gap-3 sm:gap-6 justify-center md:justify-end flex-wrap">
          {/* Current Weight */}
          <div className="bg-white border-2 border-orange-100 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 flex flex-col items-center shadow-md glassmorphism min-w-[120px]">
            <span className="text-xs text-gray-500">Current Weight</span>
            <span className="text-xl sm:text-2xl font-bold text-orange-500">
              {currentWeight} kg
            </span>
          </div>
          {/* Target Weight */}
          <div className="bg-white border-2 border-orange-100 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 flex flex-col items-center shadow-md glassmorphism min-w-[120px]">
            <span className="text-xs text-gray-500">Target Weight</span>
            <span className="text-xl sm:text-2xl font-bold text-pink-500">
              {user?.targetWeightInKgs ?? "--"} kg
            </span>
          </div>
          {/* Initial Weight */}
          <div className="bg-white border-2 border-orange-100 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 flex flex-col items-center shadow-md glassmorphism min-w-[120px]">
            <span className="text-xs text-gray-500">Started At</span>
            <span className="text-lg font-semibold text-orange-700">
              {user?.initialWeightInKgs ?? "--"} kg
            </span>
          </div>
        </div>
        <div className="flex flex-row gap-3 sm:gap-6 justify-center md:justify-end flex-wrap">
          {/* Activity Level */}
          <div className="bg-white border-2 border-orange-100 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 flex flex-col items-center shadow-md glassmorphism min-w-[120px]">
            <span className="text-xs text-gray-500">Activity Level</span>
            <span className="text-lg font-semibold text-orange-700">
              {activityLevelLabels[user?.activityLevel ?? ""] ?? "--"}
            </span>
          </div>
          {/* Goal */}
          <div className="bg-white border-2 border-orange-100 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 flex flex-col items-center shadow-md glassmorphism min-w-[120px]">
            <span className="text-xs text-gray-500">Goal</span>
            <span className="text-lg font-semibold text-orange-700">
              {goalLabels[user?.goal ?? ""] ?? "--"}
            </span>
          </div>
        </div>
      </div>
      {/* Popup */}
      {showPopup && (
        <UpdatePopup
          onClose={() => setShowPopup(false)}
          onStatusChange={() => refetch && refetch()}
        />
      )}
    </div>
  );
};

export default UserSummaryCard;
