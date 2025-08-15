"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import withAuth from "@/components/withAuth";
import Loader from "@/components/Loader";
import api from "@/lib/api";
import {
  Salad,
  Egg,
  Drumstick,
  Leaf,
  Flame,
  Bone,
  Wheat,
  UtensilsCrossed,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";

// --- Multi-step form schema ---
const dietTypeEnum = z.enum([
  "vegetarian",
  "eggetarian",
  "nonvegetarian",
  "vegan",
  "keto",
  "paleo",
  "mediterranean",
  "gluten_free",
]);

const formSchema = z.object({
  dietType: dietTypeEnum,
  intolerancesAndAllergies: z
    .string()
    .max(100, { message: "Keep it under 100 characters." }),
  excludedFoods: z
    .string()
    .max(100, { message: "Keep it under 100 characters." }),
  numberOfMeals: z.number().min(1).max(6),
  numberOfMealOptions: z.number().min(1).max(3),
  notes: z.string().max(200, { message: "Max 200 characters." }),
});

const steps = [
  {
    label: "Choose your diet style",
    description: "Pick the eating pattern that fits you best.",
    key: "dietType",
  },
  {
    label: "Allergies & intolerances",
    description: "Anything your plan should avoid?",
    key: "intolerancesAndAllergies",
  },
  {
    label: "Foods to skip",
    description: "List any foods you want left out.",
    key: "excludedFoods",
  },
  {
    label: "Meals per day",
    description: "How many times do you want to eat daily?",
    key: "numberOfMeals",
  },
  {
    label: "Meal options",
    description: "How much variety do you want for each meal?",
    key: "numberOfMealOptions",
  },
  {
    label: "Notes",
    description: "Anything else we should know? (optional)",
    key: "notes",
  },
];

const dietTypeOptions = [
  { value: "vegetarian", label: "Vegetarian", icon: Salad },
  { value: "eggetarian", label: "Eggetarian", icon: Egg },
  { value: "nonvegetarian", label: "Non-Veg", icon: Drumstick },
  { value: "vegan", label: "Vegan", icon: Leaf },
  { value: "keto", label: "Keto", icon: Flame },
  { value: "paleo", label: "Paleo", icon: Bone },
  { value: "mediterranean", label: "Mediterranean", icon: UtensilsCrossed },
  { value: "gluten_free", label: "Gluten Free", icon: Wheat },
];

const CreateDietPlanPage = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const mode = searchParams?.get("mode");
  const router = useRouter();
  const [dietPlan, setDietPlan] = useState<any[] | undefined>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Generating your plan...");
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [prefLoading, setPrefLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      dietType: "vegetarian",
      intolerancesAndAllergies: "",
      excludedFoods: "",
      numberOfMeals: 3,
      numberOfMealOptions: 2,
      notes: "",
    },
  });

  // Fetch preferences if mode=update
  useEffect(() => {
    if (mode === "update") {
      setPrefLoading(true);
      api
        .get("/diet/get-diet-preferences")
        .then((res) => {
          const {
            dietType,
            numberOfMeals,
            optionsPerMeal,
            intolerancesAndAllergies,
            excludedFoods,
            notes,
          } = res.data?.data || {};
          if (dietType) {
            form.reset({
              dietType: dietType,
              intolerancesAndAllergies: intolerancesAndAllergies || "",
              excludedFoods: excludedFoods || "",
              numberOfMeals: numberOfMeals || 3,
              numberOfMealOptions: optionsPerMeal || 2,
              notes: notes || "",
            });
          }
        })
        .catch(() => {
          toast.error("Failed to fetch diet preferences");
        })
        .finally(() => setPrefLoading(false));
    }
  }, [mode]);

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
    setLoadingMsg("Crunching the numbers...");
    try {
      const values = form.getValues();

      // Check for special update mode
      if (
        mode === "update" &&
        searchParams?.get("action") === "newDietPrefAndOldPrefWorkout"
      ) {
        // 1. Delete old diet plan
        await api.delete("/diet/delete-diet-plan");
        // 2. Create new diet plan
        const dietRes = await api.post("/diet/generate-diet-plan", {
          ...values,
          userId: user?.id,
        });
        const { status, data, message } = dietRes.data;
        if (status == 200) {
          setDietPlan(data.plan);
          toast.success(message);
        } else {
          setDietPlan(undefined);
          toast.error(`Failed to create diet plan: ${message}`);
          setLoading(false);
          setSubmitting(false);
          setLoadingMsg("Generating your plan...");
          return;
        }
        // 3. Create new workout plan (with old preferences)
        await api.put("/workout/update-workout-plan");
        // Update lastUpdatedWeightInKgs and updateRequired for user
        await api.put("/users/update-profile", {
          lastUpdatedWeightInKgs: user?.currentWeightInKgs,
          updateRequired: false,
        });
        toast.success("Old workout plan updated with previous preferences.");
        setLoading(false);
        setSubmitting(false);
        setLoadingMsg("Generating your plan...");
        return;
      }

      if (mode === "update") {
        await api.delete("/diet/delete-diet-plan");
        // Update lastUpdatedWeightInKgs and updateRequired for user
        await api.put("/users/update-profile", {
          lastUpdatedWeightInKgs: user?.currentWeightInKgs,
          updateRequired: false,
        });
      }

      const response = await api.post("/diet/generate-diet-plan", {
        ...values,
        userId: user?.id,
      });
      const { status, data, message } = response.data;
      if (status == 200) {
        setDietPlan(data.plan);
        toast.success(message);
        if (searchParams?.get("redirect") === "workout") {
          router.push("/workout?mode=update");
        } else {
          window.location.reload();
        }
      } else {
        setDietPlan(undefined);
        toast.error(`Failed to create diet plan: ${message}`);
      }
    } catch (error: any) {
      setDietPlan(undefined);
      toast.error(error?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setSubmitting(false);
      setLoadingMsg("Generating your plan...");
    }
  };

  if (!user || prefLoading) return <Loader />;

  // --- Step Content Renderers ---
  const renderStep = () => {
    const current = steps[step];
    switch (current.key) {
      case "dietType":
        return (
          <FormField
            control={form.control}
            name="dietType"
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                    {dietTypeOptions.map((opt) => {
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
      case "intolerancesAndAllergies": {
        const commonAllergies = [
          "Dairy",
          "Eggs",
          "Gluten",
          "Peanuts",
          "Tree Nuts",
          "Soy",
          "Shellfish",
          "Fish",
          "Sesame",
        ];
        return (
          <FormField
            control={form.control}
            name="intolerancesAndAllergies"
            render={({ field }) => {
              const value = field.value || "";
              const selected = value
                ? value
                    .split(",")
                    .map((v: string) => v.trim())
                    .filter(Boolean)
                : [];
              const handleBadge = (item: string) => {
                let arr = [...selected];
                if (arr.includes(item)) {
                  arr = arr.filter((i) => i !== item);
                } else {
                  arr.push(item);
                }
                field.onChange(arr.join(", "));
              };
              return (
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
                    <div className="flex flex-wrap gap-2 justify-center mb-2">
                      {commonAllergies.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`px-4 py-1.5 rounded-full border text-sm font-medium transition focus:outline-none ${
                            selected.includes(opt)
                              ? "bg-orange-500 text-white border-orange-500 shadow"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-orange-50"
                          }`}
                          onClick={() => handleBadge(opt)}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <div className="flex flex-col items-center w-full max-w-md">
                    <label className="text-sm text-gray-500 mb-1">Other</label>
                    <Input
                      className="w-full text-base border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0"
                      placeholder="Add other intolerances/allergies (comma separated)"
                      value={selected
                        .filter((s: string) => !commonAllergies.includes(s))
                        .join(", ")}
                      onChange={(e) => {
                        const others = e.target.value
                          .split(",")
                          .map((v: string) => v.trim())
                          .filter(Boolean);
                        const newVal = [
                          ...selected.filter((s: string) =>
                            commonAllergies.includes(s)
                          ),
                          ...others,
                        ].join(", ");
                        field.onChange(newVal);
                      }}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        );
      }
      case "excludedFoods":
        return (
          <FormField
            control={form.control}
            name="excludedFoods"
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
                  <div className="flex flex-col items-center justify-center bg-white/80 border border-gray-200 rounded-2xl px-8 py-6 shadow-lg w-full max-w-md">
                    <Input
                      className="w-full text-base border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 px-4 py-4 text-center"
                      style={{ minHeight: 56, fontSize: 18 }}
                      placeholder="e.g. gluten, soy, beef"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case "numberOfMeals":
        return (
          <div className="flex flex-col gap-6 w-full">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {current.label}
            </h2>
            <p className="text-gray-500 text-center mb-4">
              {current.description}
            </p>
            <div className="flex gap-3 justify-center">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <motion.button
                  key={n}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.08 }}
                  animate={{
                    backgroundColor:
                      form.watch("numberOfMeals") === n ? "#f97316" : "#fff",
                    color: form.watch("numberOfMeals") === n ? "#fff" : "#222",
                    boxShadow:
                      form.watch("numberOfMeals") === n
                        ? "0 2px 16px #f9731633"
                        : "none",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`rounded-xl border-2 px-5 py-3 font-semibold text-lg transition-all focus:outline-none ${
                    form.watch("numberOfMeals") === n
                      ? "border-orange-500"
                      : "border-gray-200 hover:border-orange-300"
                  }`}
                  onClick={() => form.setValue("numberOfMeals", n)}
                >
                  {n}
                </motion.button>
              ))}
            </div>
          </div>
        );
      case "numberOfMealOptions":
        return (
          <div className="flex flex-col gap-6 w-full">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {current.label}
            </h2>
            <p className="text-gray-500 text-center mb-4">
              {current.description}
            </p>
            <div className="flex gap-3 justify-center">
              {[1, 2, 3].map((n) => (
                <motion.button
                  key={n}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.08 }}
                  animate={{
                    backgroundColor:
                      form.watch("numberOfMealOptions") === n
                        ? "#f97316"
                        : "#fff",
                    color:
                      form.watch("numberOfMealOptions") === n ? "#fff" : "#222",
                    boxShadow:
                      form.watch("numberOfMealOptions") === n
                        ? "0 2px 16px #f9731633"
                        : "none",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`rounded-xl border-2 px-5 py-3 font-semibold text-lg transition-all focus:outline-none ${
                    form.watch("numberOfMealOptions") === n
                      ? "border-orange-500"
                      : "border-gray-200 hover:border-orange-300"
                  }`}
                  onClick={() => form.setValue("numberOfMealOptions", n)}
                >
                  {n}
                </motion.button>
              ))}
            </div>
          </div>
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
                      className="w-full min-h-[120px] text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 px-5 py-5 resize-vertical text-left placeholder-gray-400"
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
    <div className="min-h-screen flex flex-col relative bg-[#F7F7F9]">
      <main className="flex-1 flex flex-col justify-center">
        <section className="w-full px-4 md:px-10 py-10 md:py-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 tracking-tight text-left">
            Let's build your perfect diet plan
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
        </section>
      </main>
    </div>
  );
};

export default withAuth(CreateDietPlanPage);
