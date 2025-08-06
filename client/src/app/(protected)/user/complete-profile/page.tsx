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
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

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
  dateOfBirth: z.string().min(1, { message: "Date of birth is required." }),
  gender: genderEnum,
  weightInKgs: z
    .number()
    .min(10, { message: "Weight must be at least 10 kg." }),
  targetWeightInKgs: z
    .number()
    .min(10, { message: "Target weight must be at least 10 kg." }),
  heightInCms: z
    .number()
    .min(50, { message: "Height must be at least 50 cm." }),
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
    label: "Activity & Goal",
    description: "How active are you and what's your fitness goal?",
    keys: ["activityLevel", "goal"],
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
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "An error occurred");
    } finally {
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
          <div className="flex flex-col gap-8 w-full items-center">
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                      Date of Birth
                    </h2>
                  </FormLabel>
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
                <FormItem className="w-full">
                  <FormLabel>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                      Gender
                    </h2>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      className="flex gap-4 justify-center"
                      defaultValue={field.value}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <RadioGroupItem value="male" id="gender-male" />
                      <Label htmlFor="gender-male">Male</Label>
                      <RadioGroupItem value="female" id="gender-female" />
                      <Label htmlFor="gender-female">Female</Label>
                      <RadioGroupItem value="other" id="gender-other" />
                      <Label htmlFor="gender-other">Other</Label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col gap-8 w-full items-center">
            <FormField
              control={form.control}
              name="weightInKgs"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
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
                <FormItem className="w-full">
                  <FormLabel>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
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
                <FormItem className="w-full">
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col gap-8 w-full items-center">
            <FormField
              control={form.control}
              name="activityLevel"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                      Activity Level
                    </h2>
                  </FormLabel>
                  <FormControl>
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                      Goal
                    </h2>
                  </FormLabel>
                  <FormControl>
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
      className="min-h-screen flex flex-col relative bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#f7f7f9]"
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
                    ) : null}
                    {submitting ? "Submitting..." : "Submit"}
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

