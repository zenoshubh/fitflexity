import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import api from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const activityLevels = [
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "super_active",
];

const goals = [
  "maintain_weight",
  "mild_weight_loss_0_25kg_per_week",
  "weight_loss_0_5kg_per_week",
  "extreme_weight_loss_1kg_per_week",
  "mild_weight_gain_0_25kg_per_week",
  "weight_gain_0_5kg_per_week",
  "extreme_weight_gain_1kg_per_week",
];

const UpdatePopup = ({
  onClose,
  onStatusChange,
}: { onClose: () => void; onStatusChange?: () => void }) => {
  const [step, setStep] = useState(1);
  const { user } = useAuth();
  const [activityLevel, setActivityLevel] = useState(user?.activityLevel || "");
  const [goal, setGoal] = useState(user?.goal || "");
  const [planOption, setPlanOption] = useState("");
  const [resetPref, setResetPref] = useState(""); // new state for step 3
  const router = useRouter();

  const handleProfileUpdate = async () => {
    try {
      const res = await api.put("/users/update-profile", {
        activityLevel,
        goal,
      });
      const { status, message } = res.data;
      if (status === 200) {
        toast.success(message || "Profile updated successfully!");
        setStep(2);
      } else {
        toast.error(message || "Failed to update profile.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong.");
    }
  };

  const handlePlanUpdate = () => {
    if (planOption === "none") {
      onClose();
    } else {
      setStep(3);
    }
  };

  const handleFinish = async () => {
    // Logic for final submission based on planOption and resetPref
    try {
      if (planOption === "diet") {
        if (resetPref === "keep-diet") {
          await api.put("/diet/update-diet-plan");
          await api.put("/users/update-profile", {
            lastUpdatedWeightInKgs: user?.currentWeightInKgs,
            updateRequired: false,
          });
          if (onStatusChange) onStatusChange();
          toast.success("Diet plan updated!");
          onClose();
        } else if (resetPref === "reset-diet") {
          router.push("/diet/create-diet-plan?mode=update");
        }
      } else if (planOption === "workout") {
        if (resetPref === "keep-workout") {
          await api.put("/workout/update-workout-plan");
          await api.put("/users/update-profile", {
            lastUpdatedWeightInKgs: user?.currentWeightInKgs,
            updateRequired: false,
          });
          if (onStatusChange) onStatusChange();
          toast.success("Workout plan updated!");
          onClose();
        } else if (resetPref === "reset-workout") {
          router.push("/workout/create-workout-plan?mode=update");
        }
      } else if (planOption === "both") {
        if (resetPref === "reset-diet") {
          router.push(
            "/diet/create-diet-plan?mode=update&action=newDietPrefAndOldPrefWorkout"
          );
        } else if (resetPref === "reset-workout") {
          router.push(
            "/workout/create-workout-plan?mode=update&action=newWorkoutPrefAndOldPrefDiet"
          );
        } else if (resetPref === "reset-both") {
          router.push("/diet/create-diet-plan?mode=update&redirect=workout");
        } else if (resetPref === "reset-none") {
          await api.put("/diet/update-diet-plan");
          await api.put("/workout/update-workout-plan");
          await api.put("/users/update-profile", {
            lastUpdatedWeightInKgs: user?.currentWeightInKgs,
            updateRequired: false,
          });
          if (onStatusChange) onStatusChange();
          toast.success("Diet and workout plans updated!");
          onClose();
        }
      } else if (planOption === "none") {
        if (onStatusChange) onStatusChange();
        onClose();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong.");
    }
  };

  const handleCancel = async () => {
    try {
      await api.put("/users/update-profile", {
        lastUpdatedWeightInKgs: user?.currentWeightInKgs,
        updateRequired: false,
      });
      if (onStatusChange) onStatusChange();
    } catch {}
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
                  <option key={level} value={level}>
                    {level}
                  </option>
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
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="outline" onClick={() => setStep(2)}>
                Skip
              </Button>
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
                It is suggested to update your plans after changing your
                profile.
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
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handlePlanUpdate} disabled={!planOption}>
                Next
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle>
                {planOption === "diet" && "Diet Plan Preferences"}
                {planOption === "workout" && "Workout Plan Preferences"}
                {planOption === "both" && "Reset Preferences for Plans"}
              </DialogTitle>
              <DialogDescription>
                {planOption === "diet" &&
                  "Do you want to keep your current diet preferences or reset them for the new plan?"}
                {planOption === "workout" &&
                  "Do you want to keep your current workout preferences or reset them for the new plan?"}
                {planOption === "both" &&
                  "Choose which preferences you want to reset for your new plans."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 mb-4 mt-2">
              {planOption === "diet" && (
                <>
                  <Button
                    variant={resetPref === "keep-diet" ? "default" : "outline"}
                    onClick={() => setResetPref("keep-diet")}
                  >
                    Keep current diet preferences
                  </Button>
                  <Button
                    variant={resetPref === "reset-diet" ? "default" : "outline"}
                    onClick={() => setResetPref("reset-diet")}
                  >
                    Reset diet preferences
                  </Button>
                </>
              )}
              {planOption === "workout" && (
                <>
                  <Button
                    variant={
                      resetPref === "keep-workout" ? "default" : "outline"
                    }
                    onClick={() => setResetPref("keep-workout")}
                  >
                    Keep current workout preferences
                  </Button>
                  <Button
                    variant={
                      resetPref === "reset-workout" ? "default" : "outline"
                    }
                    onClick={() => setResetPref("reset-workout")}
                  >
                    Reset workout preferences
                  </Button>
                </>
              )}
              {planOption === "both" && (
                <>
                  <Button
                    variant={resetPref === "reset-diet" ? "default" : "outline"}
                    onClick={() => setResetPref("reset-diet")}
                  >
                    Reset preferences for diet only
                  </Button>
                  <Button
                    variant={
                      resetPref === "reset-workout" ? "default" : "outline"
                    }
                    onClick={() => setResetPref("reset-workout")}
                  >
                    Reset preferences for workout only
                  </Button>
                  <Button
                    variant={resetPref === "reset-both" ? "default" : "outline"}
                    onClick={() => setResetPref("reset-both")}
                  >
                    Reset preferences for both
                  </Button>
                  <Button
                    variant={resetPref === "reset-none" ? "default" : "outline"}
                    onClick={() => setResetPref("reset-none")}
                  >
                    Keep current preferences for both
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleFinish} disabled={!resetPref}>
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
