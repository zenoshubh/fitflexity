"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
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
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  HeartPulse,
  BicepsFlexed,
  Bike,
  Flame,
  Weight,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle,
  PlusCircle,
  CircleDot,
} from "lucide-react";

const HEADER_HEIGHT = 76;
const FOOTER_HEIGHT = 56;

// Zod enums
const genderEnum = z.enum(["male", "female", "other"]);
const activityLevelEnum = z.enum([
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
  "super_active",
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
  dateOfBirth: z
    .string()
    .min(1, { message: "Date of birth is required." })
    .refine((dob) => {
      // Validate YYYY-MM-DD format (native date input)
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      if (!regex.test(dob)) return false;
      const birthDate = new Date(dob);
      if (isNaN(birthDate.getTime())) return false;
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 12 && age <= 65;
    }, { message: "Enter a valid date (age 12-65)." }),
  gender: genderEnum,
  weightInKgs: z
    .number()
    .min(30, { message: "Weight must be at least 30 kg." }),
  targetWeightInKgs: z
    .number()
    .min(30, { message: "Target weight must be at least 30 kg." })
    .max(150, { message: "Target weight cannot exceed 150 kg." }),
  heightInCms: z
    .number()
    .min(50, { message: "Height must be at least 50 cm." })
    .max(250, { message: "Height cannot exceed 250 cm." }),
  activityLevel: activityLevelEnum,
  goal: goalEnum,
});

const steps = [
  {
    label: "Basic Info",
    description: "Enter your date of birth and gender.",
    keys: ["dateOfBirth", "gender"],
  },
  {
    label: "Body Metrics",
    description: "Enter your current weight, target weight, and height.",
    keys: ["weightInKgs", "targetWeightInKgs", "heightInCms"],
  },
  {
    label: "Activity Level",
    description: "How active are you?",
    keys: ["activityLevel"],
  },
  {
    label: "Goal",
    description: "What's your fitness goal?",
    keys: ["goal"],
  },
];

const activityOptions = [
  {
    value: "sedentary",
    label: "Sedentary",
    icon: <MinusCircle size={28} className="text-orange-400" />,
    desc: "Little or no exercise",
  },
  {
    value: "lightly_active",
    label: "Lightly Active",
    icon: <HeartPulse size={28} className="text-orange-400" />,
    desc: "Light exercise/sports 1-3 days/week",
  },
  {
    value: "moderately_active",
    label: "Moderately Active",
    icon: <BicepsFlexed size={28} className="text-orange-400" />,
    desc: "Moderate exercise/sports 3-5 days/week",
  },
  {
    value: "very_active",
    label: "Very Active",
    icon: <Bike size={28} className="text-orange-400" />,
    desc: "Hard exercise/sports 6-7 days/week",
  },
  {
    value: "super_active",
    label: "Super Active",
    icon: <Flame size={28} className="text-orange-400" />,
    desc: "Very hard exercise & physical job",
  },
];

const goalOptions = [
  {
    value: "maintain_weight",
    label: "Maintain Weight",
    icon: <CircleDot size={28} className="text-orange-400" />,
  },
  {
    value: "mild_weight_loss_0_25kg_per_week",
    label: "Mild Weight Loss",
    icon: <ArrowDownCircle size={28} className="text-orange-400" />,
    desc: "0.25 kg/week",
  },
  {
    value: "weight_loss_0_5kg_per_week",
    label: "Weight Loss",
    icon: <ArrowDownCircle size={28} className="text-orange-500" />,
    desc: "0.5 kg/week",
  },
  {
    value: "extreme_weight_loss_1kg_per_week",
    label: "Extreme Weight Loss",
    icon: <ArrowDownCircle size={28} className="text-red-500" />,
    desc: "1 kg/week",
  },
  {
    value: "mild_weight_gain_0_25kg_per_week",
    label: "Mild Weight Gain",
    icon: <ArrowUpCircle size={28} className="text-orange-400" />,
    desc: "0.25 kg/week",
  },
  {
    value: "weight_gain_0_5kg_per_week",
    label: "Weight Gain",
    icon: <ArrowUpCircle size={28} className="text-orange-500" />,
    desc: "0.5 kg/week",
  },
  {
    value: "extreme_weight_gain_1kg_per_week",
    label: "Extreme Weight Gain",
    icon: <ArrowUpCircle size={28} className="text-green-500" />,
    desc: "1 kg/week",
  },
];

const CompleteProfilePage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      dateOfBirth: "",
      gender: "male",
      weightInKgs: 0,
      targetWeightInKgs: 0,
      heightInCms: 0,
      activityLevel: "lightly_active",
      goal: "maintain_weight",
    },
  });

  // Progress bar percent
  const progress = ((step + 1) / steps.length) * 100;

  // Step validation
  const validateStep = () => {
    const keys = steps[step].keys;
    const values = form.getValues();
    const result = formSchema.safeParse(values);
    if (!result.success) {
      const fieldErr = result.error.issues.find((i) =>
        keys.includes(i.path[0] as string)
      );
      if (fieldErr) {
        setErrorMsg(fieldErr.message);
        return false;
      }
    }
    setErrorMsg(null);
    return true;
  };

  // Navigation
  const handleNext = () => {
    setTouched(true);
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, steps.length - 1));
      setTouched(false);
    }
  };
  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    setErrorMsg(null);
    setTouched(false);
  };

  // Submission
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const values = form.getValues();
      const response = await api.post("/users/complete-profile", values, {
        withCredentials: true,
      });
      const { status, data, message } = response.data;
      if (status == 200) {
        toast.success(message || "Profile completed successfully");
        window.location.href = "/user/dashboard";
        // Don't setSubmitting(false) here, keep spinner until redirect
        return;
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "An error occurred");
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (user?.isProfileComplete) {
      router.push("/user/dashboard");
    }
  }, [user, router]);

  if (!user || user?.isProfileComplete) return <Loader />;

  // --- Step Content Renderers ---
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col gap-10 w-full items-center">
            <div className="w-full max-w-md mx-auto flex flex-col items-center">
              <span className="text-2xl font-extrabold text-gray-900 mb-3 text-center">
                Date of Birth
              </span>
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="w-full flex flex-col items-center">
                    <FormControl>
                      <div className="max-w-[260px] mx-auto">
                        <Input
                          type="date"
                          {...field}
                          className="w-full rounded-full border border-orange-200 bg-orange-50 text-orange-500 font-semibold px-6 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 placeholder:text-orange-300 tracking-widest"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="w-full max-w-md mx-auto flex flex-col items-center">
              <span className="text-2xl font-extrabold text-gray-900 mb-3 text-center">
                Gender
              </span>
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="w-full flex flex-col items-center">
                    <FormControl>
                      <div className="flex gap-6 justify-center">
                        {["male", "female", "other"].map((g) => (
                          <button
                            key={g}
                            type="button"
                            className={`px-8 py-3 rounded-full border font-semibold transition-colors text-lg
                        ${
                          field.value === g
                            ? "bg-orange-500 text-white border-orange-500 shadow"
                            : "bg-orange-50 text-orange-500 border-orange-200 hover:bg-orange-100"
                        }
                      `}
                            onClick={() => field.onChange(g)}
                          >
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col gap-8 w-full items-center">
            <div className="flex flex-row gap-6 w-full max-w-md mx-auto">
              <FormField
                control={form.control}
                name="weightInKgs"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>
                      <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
                        Current Weight (kg)
                      </h2>
                    </FormLabel>
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
                        className="w-full rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-700 font-bold text-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 placeholder:text-orange-300"
                        placeholder="Weight"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetWeightInKgs"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>
                      <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
                        Target Weight (kg)
                      </h2>
                    </FormLabel>
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
                        className="w-full rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-700 font-bold text-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 placeholder:text-orange-300"
                        placeholder="Target"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="heightInCms"
              render={({ field }) => (
                <FormItem className="w-full max-w-md mx-auto">
                  <FormLabel>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                      Height (cm)
                    </h2>
                  </FormLabel>
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
                      className="w-full rounded-xl border-2 border-orange-300 bg-orange-50 text-orange-700 font-bold text-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all duration-200 placeholder:text-orange-300"
                      placeholder="Enter height"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 2:
        // Activity Level only
        return (
          <div className="flex flex-col gap-8 w-full items-center">
            <FormField
              control={form.control}
              name="activityLevel"
              render={({ field }) => (
                <FormItem className="w-full max-w-md mx-auto">
                  <FormLabel>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                      Activity Level
                    </h2>
                  </FormLabel>
                  <FormControl>
                    <ul className="flex flex-col gap-2">
                      {activityOptions.map((opt) => (
                        <li key={opt.value}>
                          <button
                            type="button"
                            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border transition-all duration-150
                            ${
                              field.value === opt.value
                                ? "bg-orange-100 border-orange-500 ring-2 ring-orange-400"
                                : "bg-white border-gray-200 hover:bg-orange-50"
                            }
                          `}
                            onClick={() => field.onChange(opt.value)}
                          >
                            {opt.icon}
                            <div className="flex flex-col items-start">
                              <span className="text-base font-semibold text-gray-700">
                                {opt.label}
                              </span>
                              <span className="text-xs text-gray-400">
                                {opt.desc}
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 3:
        // Goal only
        return (
          <div className="flex flex-col gap-8 w-full items-center">
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem className="w-full max-w-md mx-auto">
                  <FormLabel>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                      Goal
                    </h2>
                  </FormLabel>
                  <FormControl>
                    <ul className="flex flex-col gap-2">
                      {goalOptions.map((opt) => (
                        <li key={opt.value}>
                          <button
                            type="button"
                            className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg border transition-all duration-150
                            ${
                              field.value === opt.value
                                ? "bg-orange-100 border-orange-500 ring-2 ring-orange-400"
                                : "bg-white border-gray-200 hover:bg-orange-50"
                            }
                          `}
                            onClick={() => field.onChange(opt.value)}
                          >
                            {opt.icon}
                            <div className="flex flex-col items-start">
                              <span className="text-base font-semibold text-gray-700">
                                {opt.label}
                              </span>
                              {opt.desc && (
                                <span className="text-xs text-gray-400">
                                  {opt.desc}
                                </span>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col relative bg-[#fffefc]"
    >
      <main
        className="flex-1 flex flex-col justify-center"
      >
        <section className="w-full px-4 md:px-10 py-10 md:py-16 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 tracking-tight text-left">
            Complete Your Profile
          </h1>
          {/* Progress Bar */}
          <div className="w-full mb-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-500">
                Step {step + 1} of {steps.length}
              </span>
              <span className="text-sm font-semibold text-orange-500">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>

          {/* Step Content */}
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                step < steps.length - 1 ? handleNext() : handleSubmit();
              }}
            >
              <div className="w-full">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="w-full"
                  >
                    {renderStep()}
                    {errorMsg && touched && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-4 flex items-center justify-center w-full"
                      >
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2 shadow-sm text-base font-medium animate-in fade-in">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                            />
                          </svg>
                          <span>{errorMsg}</span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="flex w-full justify-between items-center mt-10 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 px-5 py-2 rounded-full text-base font-medium border-gray-300 hover:border-orange-400"
                  onClick={handleBack}
                  disabled={step === 0 || submitting}
                >
                  <ArrowLeft size={18} /> Back
                </Button>
                {step < steps.length - 1 ? (
                  <Button
                    type="submit"
                    className="flex items-center gap-2 px-7 py-2 rounded-full text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
                    disabled={submitting}
                  >
                    Next <ArrowRight size={18} />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex items-center gap-2 px-7 py-2 rounded-full text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 mr-2 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                        Submitting...
                      </>
                    ) : "Submit"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </section>
      </main>
    </div>
  );
};

export default withAuth(CompleteProfilePage);

