import React, { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

const activityLevels = [
  "Sedentary",
  "Lightly Active",
  "Moderately Active",
  "Very Active",
];

const goals = [
  "Lose Weight",
  "Maintain Weight",
  "Gain Weight",
];

const UpdatePopup = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const [activityLevel, setActivityLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [planOption, setPlanOption] = useState("");

  // Dummy API call
  const handleProfileUpdate = async () => {
    // Replace with your actual API call
    // await api.post("/update-profile", { activityLevel, goal });
    setStep(2);
  };

  const handlePlanUpdate = () => {
    // Handle plan update logic here
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>Update Your Profile</DialogTitle>
              <DialogDescription>
                Select your activity level and goal to update your profile.
              </DialogDescription>
            </DialogHeader>
            <div className="mb-4 mt-2">
              <label className="block mb-2 font-medium">Activity Level</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
              >
                <option value="">Select activity level</option>
                {activityLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Goal</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
                <option value="">Select goal</option>
                {goals.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                onClick={handleProfileUpdate}
                disabled={!activityLevel || !goal}
              >
                Next
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>Update Your Fitness Plans?</DialogTitle>
              <DialogDescription>
                It is suggested to update your plans after changing your profile.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 mb-4 mt-2">
              <Button
                variant={planOption === "diet" ? "default" : "outline"}
                onClick={() => setPlanOption("diet")}
              >
                Yes, update my diet plan
              </Button>
              <Button
                variant={planOption === "workout" ? "default" : "outline"}
                onClick={() => setPlanOption("workout")}
              >
                Yes, update my workout plan
              </Button>
              <Button
                variant={planOption === "both" ? "default" : "outline"}
                onClick={() => setPlanOption("both")}
              >
                Yes, update both
              </Button>
              <Button
                variant={planOption === "none" ? "default" : "outline"}
                onClick={() => setPlanOption("none")}
              >
                Don't Update
              </Button>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                onClick={handlePlanUpdate}
                disabled={!planOption}
              >
                Finish
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePopup;