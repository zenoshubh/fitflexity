"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import withAuth from "@/components/withAuth";
import axios from "axios";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import Loader from "@/components/Loader";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";
import Male_10percent from "@/assets/Male_lessThan10percent.png";
import Male_11To18percent from "@/assets/Male_11To18percent.png";
import Male_19To25percent from "@/assets/Male_19To25percent.png";
import Male_moreThan26percent from "@/assets/Male_moreThan26percent.png";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Zod enums

const genderEnum = z.enum(["male", "female", "other"]);

const activityLevelEnum = z.enum([
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "super_active",
]);

const bodyFatPercentageEnum = z.enum([
  "less_than_10",
  "between_11_and_18",
  "between_19_and_25",
  "more_than_26",
]);

const goalEnum = z.enum([
  "maintain_weight",
  "mild_weight_loss_0_25kg_per_week",
  "weight_loss_0_5kg_per_week",
  "extreme_weight_loss_1kg_per_week",
  "mild_weight_gain_0_25kg_per_week",
  "weight_gain_0_5kg_per_week",
  "extreme_weight_gain_1kg_per_week",
]);

const formSchema = z.object({
  dateOfBirth: z.string().min(1, { message: "Date of birth is required." }),
  weightInKgs: z
    .number()
    .min(10, { message: "Weight must be at least 10 kg." }),
  heightInCms: z
    .number()
    .min(50, { message: "Height must be at least 50 cm." }),
  bodyFatPercentage: bodyFatPercentageEnum,
  activityLevel: activityLevelEnum,
  goal: goalEnum,
  gender: genderEnum,
});

const bodyFatOptions = [
  {
    value: "less_than_10",
    img: Male_10percent,
    label: "<10%",
  },
  {
    value: "between_11_and_18",
    img: Male_11To18percent,
    label: "11-18%",
  },
  {
    value: "between_19_and_25",
    img: Male_19To25percent,
    label: "19-25%",
  },
  {
    value: "more_than_26",
    img: Male_moreThan26percent,
    label: ">26%",
  },
];

const HEADER_HEIGHT = 76;
const FOOTER_HEIGHT = 56;

const CompleteProfilePage = () => {
  const { user } = useAuth();

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dateOfBirth: "",
      weightInKgs: 0,
      heightInCms: 0,
      bodyFatPercentage: "between_19_and_25",
      activityLevel: "lightly_active",
      goal: "maintain_weight",
      gender: "male",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await api.post("/users/complete-profile", values, {
        withCredentials: true,
      });
      const { status, data, message } = response.data;
      if (status == 200) {
        toast.success(message || "Profile completed successfully");
        window.location.href = "/user/dashboard";
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "An error occurred");
    }
  }

  useEffect(() => {
    if (user?.isProfileComplete) {
      router.push("/user/dashboard");
    }
  }, [user, router]);

  return user?.isProfileComplete ? (
    <Loader />
  ) : (
    <div
      className="min-h-screen flex flex-col relative bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#f7f7f9]"
      style={{
        backgroundImage:
          "radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px), radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px)",
        backgroundSize: "28px 28px",
        backgroundPosition: "0 0, 14px 14px",
      }}
    >
      <Navbar />
      <main
        className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 max-w-3xl mx-auto w-full"
        style={{
          paddingTop: `${HEADER_HEIGHT}px`,
          paddingBottom: `${FOOTER_HEIGHT + 32}px`,
        }}
      >
        <div className="w-full max-w-xl bg-white/70 backdrop-blur-2xl border border-gray-200 rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-8 glassmorphism">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 text-center">
            Complete Your Profile
          </h1>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <RadioGroup
                        className="flex gap-4"
                        defaultValue={field.value}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <RadioGroupItem
                          value="male"
                          id="gender-male"
                        />
                        <Label htmlFor="gender-male">Male</Label>
                        <RadioGroupItem
                          value="female"
                          id="gender-female"
                        />
                        <Label htmlFor="gender-female">Female</Label>
                        <RadioGroupItem
                          value="other"
                          id="gender-other"
                        />
                        <Label htmlFor="gender-other">Other</Label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weightInKgs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heightInCms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bodyFatPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body Fat Percentage</FormLabel>
                    <FormControl>
                      <RadioGroup
                        className="flex gap-4"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        {bodyFatOptions.map((option) => {
                          const checked = field.value === option.value;
                          return (
                            <RadioGroupItem
                              key={option.value}
                              value={option.value}
                              id={`bodyfat-${option.value}`}
                              className="sr-only"
                            />
                          );
                        })}
                        {bodyFatOptions.map((option) => {
                          const checked = field.value === option.value;
                          return (
                            <label
                              key={option.value}
                              htmlFor={`bodyfat-${option.value}`}
                              className={`flex flex-col items-center cursor-pointer border rounded-lg p-2 transition
                                ${
                                  checked
                                    ? "ring-2 ring-primary border-primary"
                                    : "border-muted"
                                }
                              `}
                              tabIndex={0}
                            >
                              <Image
                                src={option.img}
                                alt={option.label}
                                width={80}
                                height={80}
                                className="rounded mb-2"
                              />
                              <span className="text-xs">{option.label}</span>
                            </label>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="activityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary</SelectItem>
                        <SelectItem value="lightly_active">Lightly Active</SelectItem>
                        <SelectItem value="moderately_active">
                          Moderately Active
                        </SelectItem>
                        <SelectItem value="very_active">Very Active</SelectItem>
                        <SelectItem value="super_active">Super Active</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintain_weight">Maintain Weight</SelectItem>
                        <SelectItem value="mild_weight_loss_0_25kg_per_week">
                          Mild Weight Loss (0.25 kg/week)
                        </SelectItem>
                        <SelectItem value="weight_loss_0_5kg_per_week">
                          Weight Loss (0.5 kg/week)
                        </SelectItem>
                        <SelectItem value="extreme_weight_loss_1kg_per_week">
                          Extreme Weight Loss (1 kg/week)
                        </SelectItem>
                        <SelectItem value="mild_weight_gain_0_25kg_per_week">
                          Mild Weight Gain (0.25 kg/week)
                        </SelectItem>
                        <SelectItem value="weight_gain_0_5kg_per_week">
                          Weight Gain (0.5 kg/week)
                        </SelectItem>
                        <SelectItem value="extreme_weight_gain_1kg_per_week">
                          Extreme Weight Gain (1 kg/week)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold text-lg px-8 py-3 rounded-full shadow-lg transition flex items-center justify-center gap-2"
              >
                Submit
              </Button>
            </form>
          </Form>
        </div>
      </main>
      <Footer />
      <style jsx global>{`
        .glassmorphism {
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
          backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
};

export default withAuth(CompleteProfilePage);
