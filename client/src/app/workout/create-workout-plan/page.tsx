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
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import withAuth from "@/components/withAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Dumbbell,
  Flame,
  HeartPulse,
  BicepsFlexed,
  Bike,
  User,
  Users,
  Award,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HEADER_HEIGHT = 76;
const FOOTER_HEIGHT = 56;

// Enums as per schema
const workoutTypeEnum = z.enum([
  "weighted",
  "bodyweight",
  "HIIT",
  "weighted+cardio",
  "bodyweight+cardio",
]);

const experienceLevelEnum = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

const formSchema = z.object({
  workoutType: workoutTypeEnum,
  numberOfDays: z
    .number()
    .min(2, { message: "At least 2 days is required" })
    .max(6, { message: "Max 6 days allowed" }),
  totalDurationMins: z
    .number()
    .min(30, { message: "At least 30 minutes is required" })
    .max(120, { message: "Max 120 minutes allowed" }),
  experience: experienceLevelEnum,
  notes: z.string().max(200, { message: "Max 200 characters allowed" }),
});

const steps = [
  {
    label: "Choose Workout Type",
    description: "Pick the style of workouts you want.",
    key: "workoutType",
  },
  {
    label: "Number of Days",
    description: "How many days per week do you want to train?",
    key: "numberOfDays",
  },
  {
    label: "Session Duration",
    description: "How long should each workout session be?",
    key: "totalDurationMins",
  },
  {
    label: "Experience Level",
    description: "Select your training experience.",
    key: "experience",
  },
  {
    label: "Notes",
    description: "Any special requests or notes? (optional)",
    key: "notes",
  },
];

const workoutTypeOptions = [
  { value: "bodyweight", label: "Bodyweight", icon: User },
  { value: "weighted", label: "Weighted", icon: Dumbbell },
  { value: "HIIT", label: "HIIT", icon: Flame },
  { value: "bodyweight+cardio", label: "Bodyweight+Cardio", icon: BicepsFlexed },
  { value: "weighted+cardio", label: "Weighted+Cardio", icon: Bike },
];

const experienceOptions = [
  { value: "beginner", label: "Beginner", icon: User },
  { value: "intermediate", label: "Intermediate", icon: Users },
  { value: "advanced", label: "Advanced", icon: Award },
];

const CreateWorkoutPlanPage = () => {
  const [workoutPlan, setWorkoutPlan] = useState<any[] | undefined>([]);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Generating your workout plan...");
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadingMessages = [
    "Calculating your workout metrics...",
    "Selecting the best workout combinations...",
    "AI is generating your personalized workouts...",
    "Balancing workout intensity and preferences...",
    "Almost done! Finalizing your plan...",
  ];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      workoutType: "weighted",
      numberOfDays: 3,
      totalDurationMins: 60,
      experience: "beginner",
      notes: "",
    },
  });

  // Progress bar percent
  const progress = ((step + 1) / steps.length) * 100;

  // Step validation
  const validateStep = () => {
    const keys = steps[step].key;
    const values = form.getValues();
    const result = formSchema.safeParse(values);
    if (!result.success) {
      const fieldErr = result.error.issues.find((i) => i.path[0] === keys);
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
    setLoading(true);
    setLoadingMsg(loadingMessages[0]);
    let msgIdx = 1;
    let interval: NodeJS.Timeout | null = null;
    try {
      interval = setInterval(() => {
        setLoadingMsg(loadingMessages[msgIdx % loadingMessages.length]);
        msgIdx++;
      }, 1800);

      const values = form.getValues();
      const response = await api.post("/workout/generate-workout-plan", {
        ...values,
        userId: user?.id,
      });

      const { status, data, message } = response.data;

      if (status == 200) {
        setWorkoutPlan(data.plan);
        toast.success(`${message}`);
      } else {
        setWorkoutPlan(undefined);
        toast.error(`Failed to create workout plan: ${message}`);
      }
    } catch (error: any) {
      setWorkoutPlan(undefined);
      toast.error(error?.response?.data?.message || "Something went wrong.");
    } finally {
      if (interval) clearInterval(interval);
      setLoading(false);
      setSubmitting(false);
      setLoadingMsg(loadingMessages[0]);
    }
  };

  if (!user) return <Loader />;

  // --- Step Content Renderers ---
  const renderStep = () => {
    const current = steps[step];
    switch (current.key) {
      case "workoutType":
        return (
          <FormField
            control={form.control}
            name="workoutType"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-6 w-full">
                <FormLabel>
                  <h2 className="text-2xl mx-auto font-bold text-gray-900 text-center mb-2">
                    {current.label}
                  </h2>
                </FormLabel>
                <p className="text-gray-500 text-center mb-4">
                  {current.description}
                </p>
                <FormControl>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                    {workoutTypeOptions.map((opt) => {
                      const Icon = opt.icon;
                      const selected = field.value === opt.value;
                      return (
                        <motion.button
                          key={opt.value}
                          type="button"
                          whileTap={{ scale: 0.92 }}
                          whileHover={{ scale: 1.08 }}
                          animate={{
                            backgroundColor: selected ? "#f97316" : "#fff",
                            color: selected ? "#fff" : "#222",
                            boxShadow: selected
                              ? "0 2px 16px #f9731633"
                              : "none",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all px-4 py-6 cursor-pointer focus:outline-none ${
                            selected
                              ? "border-orange-500"
                              : "border-gray-200 hover:border-orange-300"
                          }`}
                          onClick={() => field.onChange(opt.value)}
                        >
                          <Icon size={36} />
                          <span className="font-medium text-base mt-1">
                            {opt.label}
                          </span>
                          {selected && (
                            <CheckCircle2
                              className="text-white bg-orange-500 rounded-full mt-2"
                              size={20}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case "numberOfDays":
        return (
          <FormField
            control={form.control}
            name="numberOfDays"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-6 w-full items-center">
                <FormLabel>
                  <h2 className="text-2xl mx-auto font-bold text-gray-900 text-center mb-2">
                    {current.label}
                  </h2>
                </FormLabel>
                <p className="text-gray-500 text-center mb-4">
                  {current.description}
                </p>
                <FormControl>
                  <div className="flex gap-3 justify-center">
                    {[2, 3, 4, 5, 6].map((n) => (
                      <motion.button
                        key={n}
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ scale: 1.08 }}
                        animate={{
                          backgroundColor: field.value === n ? "#f97316" : "#fff",
                          color: field.value === n ? "#fff" : "#222",
                          boxShadow:
                            field.value === n
                              ? "0 2px 16px #f9731633"
                              : "none",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className={`rounded-xl border-2 px-5 py-3 font-semibold text-lg transition-all focus:outline-none ${
                          field.value === n
                            ? "border-orange-500"
                            : "border-gray-200 hover:border-orange-300"
                        }`}
                        onClick={() => field.onChange(n)}
                      >
                        {n}
                      </motion.button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case "totalDurationMins":
        return (
          <FormField
            control={form.control}
            name="totalDurationMins"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-6 w-full items-center">
                <FormLabel>
                  <h2 className="text-2xl mx-auto font-bold text-gray-900 text-center mb-2">
                    {current.label}
                  </h2>
                </FormLabel>
                <p className="text-gray-500 text-center mb-4">
                  {current.description}
                </p>
                <FormControl>
                  <Input
                    type="number"
                    min="30"
                    max="120"
                    className="w-full text-base border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="Minutes per session"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case "experience":
        return (
          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-6 w-full">
                <FormLabel>
                  <h2 className="text-2xl mx-auto font-bold text-gray-900 text-center mb-2">
                    {current.label}
                  </h2>
                </FormLabel>
                <p className="text-gray-500 text-center mb-4">
                  {current.description}
                </p>
                <FormControl>
                  <div className="grid grid-cols-3 gap-4 w-full">
                    {experienceOptions.map((opt) => {
                      const Icon = opt.icon;
                      const selected = field.value === opt.value;
                      return (
                        <motion.button
                          key={opt.value}
                          type="button"
                          whileTap={{ scale: 0.92 }}
                          whileHover={{ scale: 1.08 }}
                          animate={{
                            backgroundColor: selected ? "#f97316" : "#fff",
                            color: selected ? "#fff" : "#222",
                            boxShadow: selected
                              ? "0 2px 16px #f9731633"
                              : "none",
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                          className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all px-4 py-6 cursor-pointer focus:outline-none ${
                            selected
                              ? "border-orange-500"
                              : "border-gray-200 hover:border-orange-300"
                          }`}
                          onClick={() => field.onChange(opt.value)}
                        >
                          <Icon size={36} />
                          <span className="font-medium text-base mt-1">
                            {opt.label}
                          </span>
                          {selected && (
                            <CheckCircle2
                              className="text-white bg-orange-500 rounded-full mt-2"
                              size={20}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case "notes":
        return (
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-6 w-full items-center">
                <FormLabel>
                  <h2 className="text-2xl mx-auto font-bold text-gray-900 text-center mb-2">
                    {current.label}
                  </h2>
                </FormLabel>
                <p className="text-gray-500 text-center mb-4">
                  {current.description}
                </p>
                <FormControl>
                  <div className="flex flex-col items-center justify-center bg-white/80 border border-gray-200 rounded-2xl px-8 py-8 shadow-lg w-full max-w-2xl">
                    <textarea
                      className="w-full min-h-[100px] text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 px-5 py-5 resize-vertical text-left placeholder-gray-400"
                      style={{ fontSize: 20, lineHeight: 1.6 }}
                      placeholder="Anything else? (optional)"
                      maxLength={200}
                      {...field}
                    />
                    <div className="w-full flex justify-end mt-2">
                      <span className="text-xs text-gray-400">
                        {(field.value || "").length}/200
                      </span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col relative bg-[#F7F7F9]"
      style={{
        backgroundImage:
          "radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px), radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px)",
        backgroundSize: "28px 28px",
        backgroundPosition: "0 0, 14px 14px",
      }}
    >
      <Navbar />
      <main
        className="flex-1 flex flex-col justify-center"
        style={{
          paddingTop: `${HEADER_HEIGHT}px`,
          paddingBottom: `${FOOTER_HEIGHT + 32}px`,
        }}
      >
        <section className="w-full px-4 md:px-10 py-10 md:py-16 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 tracking-tight text-left">
            Build your personalized workout plan
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
                  disabled={step === 0 || loading || submitting}
                >
                  <ArrowLeft size={18} /> Back
                </Button>
                {step < steps.length - 1 ? (
                  <Button
                    type="submit"
                    className="flex items-center gap-2 px-7 py-2 rounded-full text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
                    disabled={loading || submitting}
                  >
                    Next <ArrowRight size={18} />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex items-center gap-2 px-7 py-2 rounded-full text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
                    disabled={loading || submitting}
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
                    {submitting ? "Generating..." : "Create Plan"}
                  </Button>
                )}
              </div>
              {loading && (
                <div className="w-full flex flex-col items-center mt-4">
                  <span className="text-orange-600 font-medium text-base animate-pulse text-center">
                    {loadingMsg}
                  </span>
                </div>
              )}
            </form>
          </Form>

          {/* Workout Plan Display */}
          {workoutPlan && workoutPlan.length > 0 && (
            <div className="mt-12 w-full bg-white/80 border border-gray-200 rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Your Workout Plan
              </h2>
              <pre className="text-gray-700 text-base whitespace-pre-wrap break-words">
                {JSON.stringify(workoutPlan, null, 2)}
              </pre>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default withAuth(CreateWorkoutPlanPage);
