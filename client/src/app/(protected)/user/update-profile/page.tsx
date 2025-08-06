"use client";

import React from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import withAuth from "@/components/withAuth";
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

const genders = [
  "male",
  "female",
  "other",
];

type UpdateProfileFormValues = {
  dateOfBirth: string;
  gender: string;
  heightInCms: string;
  activityLevel: string;
  goal: string;
};

const UpdateProfilePage = () => {
  const { user } = useAuth();

  const form = useForm<UpdateProfileFormValues>({
    defaultValues: {
      dateOfBirth: user?.dateOfBirth || "",
      gender: user?.gender || "",
      heightInCms: user?.heightInCms ? String(user.heightInCms) : "",
      activityLevel: user?.activityLevel || "",
      goal: user?.goal || "",
    },
  });

  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (values: UpdateProfileFormValues) => {
    setLoading(true);
    try {
      const res = await api.put("/users/update-profile", {
        ...values,
        heightInCms: Number(values.heightInCms),
      });
      const { status, message } = res.data;
      if (status === 200) {
        toast.success(message || "Profile updated successfully!");
        // Optionally redirect or close popup
      } else {
        toast.error(message || "Failed to update profile.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-[#F7F7F9]"
      style={{
        backgroundImage:
          "radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px), radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px)",
        backgroundSize: "28px 28px",
        backgroundPosition: "0 0, 14px 14px",
      }}
    >
      <div className="w-full max-w-md bg-white/80 backdrop-blur-lg border border-gray-200 rounded-3xl shadow-2xl p-6">
        <h2 className="text-2xl font-extrabold text-orange-700 text-center mb-2">
          Update Your Profile
        </h2>
        <p className="text-sm text-orange-600 text-center mb-6">
          Update your basic information and preferences.
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="dateOfBirth"
              rules={{ required: "Date of birth is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-orange-700">
                    Date of Birth
                  </FormLabel>
                  <FormControl>
                    <input
                      type="date"
                      className="w-full border rounded-lg px-3 py-2 bg-white/90"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              rules={{ required: "Gender is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-orange-700">
                    Gender
                  </FormLabel>
                  <FormControl>
                    <select
                      className="w-full border rounded-lg px-3 py-2 bg-white/90"
                      {...field}
                    >
                      <option value="">Select gender</option>
                      {genders.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="heightInCms"
              rules={{
                required: "Height is required",
                validate: (v) =>
                  (!isNaN(Number(v)) && Number(v) > 0) ||
                  "Enter a valid height",
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-orange-700">
                    Height (cm)
                  </FormLabel>
                  <FormControl>
                    <input
                      type="number"
                      min={0}
                      className="w-full border rounded-lg px-3 py-2 bg-white/90"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activityLevel"
              rules={{ required: "Activity level is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-orange-700">
                    Activity Level
                  </FormLabel>
                  <FormControl>
                    <select
                      className="w-full border rounded-lg px-3 py-2 bg-white/90"
                      {...field}
                    >
                      <option value="">Select activity level</option>
                      {activityLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="goal"
              rules={{ required: "Goal is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-orange-700">
                    Goal
                  </FormLabel>
                  <FormControl>
                    <select
                      className="w-full border rounded-lg px-3 py-2 bg-white/90"
                      {...field}
                    >
                      <option value="">Select goal</option>
                      {goals.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl py-2 mt-2"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default withAuth(UpdateProfilePage);