import { useAuth } from "@/hooks/useAuth";
import React, { useState } from "react";
import { Badge } from "./ui/badge";
import UpdatePopup from "./UpdatePopup";

const UserSummaryCard = ({ currentWeight }: { currentWeight: number }) => {
  const { user } = useAuth();
  const [showPopup, setShowPopup] = useState(false);

  const goals = [
    { label: "Lose 5 kg", progress: 40 },
    { label: "Run 5K", progress: 70 },
  ];

  const handleBadgeClick = () => {
    setShowPopup(true);
  };

  return (
    <div className="w-full max-w-3xl bg-white/70 backdrop-blur-2xl border border-gray-200 rounded-3xl shadow-2xl p-8 flex flex-col md:flex-row items-center gap-8 mb-10 mt-4 glassmorphism">
      <div className="flex flex-col items-center md:items-start gap-3 flex-1">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-400 to-pink-400 flex items-center justify-center shadow-lg mb-2">
          <span className="text-4xl font-bold text-white">
            {user?.firstName?.[0] ?? "U"}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 text-center md:text-left">
          Welcome, {user?.firstName}!
        </h1>
        <div className="text-gray-500 text-base md:text-lg text-center md:text-left">
          {/* Show badge if updateRequired is true */}
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
      </div>
      <div className="flex flex-col gap-6 flex-1 w-full">
        <div className="flex flex-row gap-6 justify-center md:justify-end">
          {/* Current Weight */}
          <div className="bg-white/80 border border-gray-100 rounded-2xl px-6 py-4 flex flex-col items-center shadow-md glassmorphism">
            <span className="text-xs text-gray-500">Current Weight</span>
            <span className="text-2xl font-bold text-orange-500">
              {currentWeight}
            </span>
          </div>
          {/* Goals */}
          <div className="bg-white/80 border border-gray-100 rounded-2xl px-6 py-4 flex flex-col items-center shadow-md glassmorphism min-w-[120px]">
            <span className="text-xs text-gray-500">Goals</span>
            <div className="flex flex-col gap-2 mt-1 w-full">
              {goals.map((goal, idx) => (
                <div key={idx} className="w-full">
                  <span className="text-sm font-semibold text-gray-700">
                    {goal.label}
                  </span>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-pink-400 h-2 rounded-full transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Popup */}
      {showPopup && <UpdatePopup onClose={() => setShowPopup(false)} />}
    </div>
  );
};

export default UserSummaryCard;
