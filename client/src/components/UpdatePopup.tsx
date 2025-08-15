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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";

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

const activityLevelLabels: Record<string, string> = {
  sedentary: "Sedentary",
  lightly_active: "Lightly Active",
  moderately_active: "Moderately Active",
  very_active: "Very Active",
  super_active: "Super Active",
};

const goalLabels: Record<string, string> = {
  maintain_weight: "Maintain Weight",
  mild_weight_loss_0_25kg_per_week: "Mild Weight Loss (0.25kg/week)",
  weight_loss_0_5kg_per_week: "Weight Loss (0.5kg/week)",
  extreme_weight_loss_1kg_per_week: "Extreme Weight Loss (1kg/week)",
  mild_weight_gain_0_25kg_per_week: "Mild Weight Gain (0.25kg/week)",
  weight_gain_0_5kg_per_week: "Weight Gain (0.5kg/week)",
  extreme_weight_gain_1kg_per_week: "Extreme Weight Gain (1kg/week)",
};

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

  // Check for plan existence
  const hasDietPlan = !!user?.hasDietPlan;
  const hasWorkoutPlan = !!user?.hasWorkoutPlan;

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

  // Step 2 options logic
  const getStep2Options = () => {
    const options = [];
    if (hasDietPlan) {
      options.push({
        key: "diet",
        label: "Yes, update my diet plan",
        type: "update",
      });
    } else {
      options.push({
        key: "create-diet",
        label: "Create Diet Plan",
        type: "create",
      });
    }
    if (hasWorkoutPlan) {
      options.push({
        key: "workout",
        label: "Yes, update my workout plan",
        type: "update",
      });
    } else {
      options.push({
        key: "create-workout",
        label: "Create Workout Plan",
        type: "create",
      });
    }
    if (hasDietPlan && hasWorkoutPlan) {
      options.push({
        key: "both",
        label: "Yes, update both",
        type: "update",
      });
    }
    if (!hasDietPlan && !hasWorkoutPlan) {
      options.push({
        key: "create-both",
        label: "Create Diet & Workout Plans",
        type: "create",
      });
    }
    options.push({
      key: "none",
      label: "Don't Update/Create",
      type: "none",
    });
    return options;
  };

  // Step 3 options logic
  const getStep3Options = () => {
    if (planOption === "diet") {
      return [
        { key: "keep-diet", label: "Keep current diet preferences" },
        { key: "reset-diet", label: "Reset diet preferences" },
      ];
    }
    if (planOption === "workout") {
      return [
        { key: "keep-workout", label: "Keep current workout preferences" },
        { key: "reset-workout", label: "Reset workout preferences" },
      ];
    }
    if (planOption === "both") {
      return [
        { key: "reset-diet", label: "Reset preferences for diet only" },
        { key: "reset-workout", label: "Reset preferences for workout only" },
        { key: "reset-both", label: "Reset preferences for both" },
        { key: "reset-none", label: "Keep current preferences for both" },
      ];
    }
    return [];
  };

  const handlePlanUpdate = () => {
    // For create options, go directly to create page
    if (planOption === "create-diet") {
      router.push("/diet");
      onClose();
      return;
    }
    if (planOption === "create-workout") {
      router.push("/workout");
      onClose();
      return;
    }
    if (planOption === "create-both") {
      router.push("/diet?redirect=workout");
      onClose();
      return;
    }
    if (planOption === "none") {
      onClose();
      return;
    }
    // For update options, go to step 3
    setStep(3);
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
          router.push("/diet?mode=update");
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
          router.push("/workout?mode=update");
        }
      } else if (planOption === "both") {
        if (resetPref === "reset-diet") {
          router.push(
            "/diet?mode=update&action=newDietPrefAndOldPrefWorkout"
          );
        } else if (resetPref === "reset-workout") {
          router.push(
            "/workout?mode=update&action=newWorkoutPrefAndOldPrefDiet"
          );
        } else if (resetPref === "reset-both") {
          router.push("/diet?mode=update&redirect=workout");
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
      <DialogContent
        className="max-w-md rounded-2xl bg-[#fffefc] shadow-lg border border-orange-100"
        style={{
          background: "linear-gradient(90deg, #fffefc 80%, #fff7ed 100%)",
        }}
      >
        {/* Decorative icons similar to HeroSection */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <svg
            className="absolute left-2 top-8 opacity-10 text-orange-500 hidden sm:block"
            width="40"
            height="40"
          >
            {/* Dumbbell icon SVG or use lucide-react if available */}
          </svg>
          <svg
            className="absolute right-4 top-16 opacity-10 text-orange-500 hidden sm:block"
            width="32"
            height="32"
          >
            {/* HeartPulse icon SVG or use lucide-react if available */}
          </svg>
          <svg
            className="absolute left-1/2 top-2 opacity-20 text-orange-500"
            width="18"
            height="18"
          >
            {/* Sparkles icon SVG or use lucide-react if available */}
          </svg>
          <svg
            className="absolute right-2 bottom-2 opacity-20 text-orange-500"
            width="18"
            height="18"
          >
            {/* Sparkles icon SVG or use lucide-react if available */}
          </svg>
        </div>
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
              <Select
                value={activityLevel}
                onValueChange={setActivityLevel}
              >
                <SelectTrigger className="w-full border rounded-lg px-3 py-2">
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  {activityLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {activityLevelLabels[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Goal</label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger className="w-full border rounded-lg px-3 py-2">
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map((g) => (
                    <SelectItem key={g} value={g}>
                      {goalLabels[g]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                className="rounded-full border-2 border-orange-500 text-orange-500 bg-white hover:bg-orange-50 shadow transition"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-2 border-orange-500 text-orange-500 bg-white hover:bg-orange-50 shadow transition"
                onClick={() => setStep(2)}
              >
                Skip
              </Button>
              <Button
                className="rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow transition"
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
              <DialogTitle>
                {hasDietPlan || hasWorkoutPlan
                  ? "Update or Create Your Fitness Plans?"
                  : "Create Your Fitness Plans?"}
              </DialogTitle>
              <DialogDescription>
                {hasDietPlan || hasWorkoutPlan
                  ? "It is suggested to update your plans after changing your profile. If you don't have a plan, you can create one."
                  : "You don't have any plans yet. Create your diet and/or workout plan to get started."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 mb-4 mt-2">
              {getStep2Options().map((opt) => (
                <Button
                  key={opt.key}
                  variant={planOption === opt.key ? "default" : "outline"}
                  className={`rounded-full shadow transition ${
                    planOption === opt.key
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50"
                  }`}
                  onClick={() => setPlanOption(opt.key)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                className="rounded-full border-2 border-orange-500 text-orange-500 bg-white hover:bg-orange-50 shadow transition"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                className="rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow transition"
                onClick={handlePlanUpdate}
                disabled={!planOption}
              >
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
              {getStep3Options().map((opt) => (
                <Button
                  key={opt.key}
                  variant={resetPref === opt.key ? "default" : "outline"}
                  className={`rounded-full shadow transition ${
                    resetPref === opt.key
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50"
                  }`}
                  onClick={() => setResetPref(opt.key)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                className="rounded-full border-2 border-orange-500 text-orange-500 bg-white hover:bg-orange-50 shadow transition"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                className="rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow transition"
                onClick={handleFinish}
                disabled={!resetPref}
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
             