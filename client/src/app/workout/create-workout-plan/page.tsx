"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { number, z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import withAuth from "@/components/withAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

// Zod schema for TableHeader form
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
  experience : experienceLevelEnum,
  notes: z.string().max(200, { message: "Max 200 characters allowed" }),
});

const CreateWorkoutPlanPage = () => {
  const [workoutPlan, setWorkoutPlan] = useState<any[] | undefined>([]);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Generating your workout plan...");
  const loadingMessages = [
    "Calculating your workout metrics...",
    "Selecting the best workout combinations...",
    "AI is generating your personalized workouts...",
    "Balancing workout intensity and preferences...",
    "Almost done! Finalizing your plan...",
  ];

  type FormSchemaType = z.infer<typeof formSchema>;
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workoutType: "weighted",
      numberOfDays: 3,
      totalDurationMins: 60,
      experience: "beginner",
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setLoadingMsg(loadingMessages[0]);
    let msgIdx = 1;
    let interval: NodeJS.Timeout | null = null;
    try {
      interval = setInterval(() => {
        setLoadingMsg(loadingMessages[msgIdx % loadingMessages.length]);
        msgIdx++;
      }, 1800);

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
      console.error("Error creating workout plan:", error);
      toast.error(`${error?.response?.data?.message}`);
    } finally {
      if (interval) clearInterval(interval);
      setLoading(false);
      setLoadingMsg(loadingMessages[0]);
    }
  }

  if (!user) return <Loader />;

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
        className="flex-1 flex flex-col items-center justify-center px-8 py-12 md:py-20 max-w-3xl mx-auto w-full"
        style={{
          paddingTop: `${HEADER_HEIGHT}px`,
          paddingBottom: `${FOOTER_HEIGHT + 32}px`,
        }}
      >
        <div className="w-full max-w-xl bg-white/80 backdrop-blur-lg border border-gray-200 rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 text-center">
            Create Your Workout Plan
          </h1>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 w-full"
            >
              <FormField
                control={form.control}
                name="workoutType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workout Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select workout type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bodyweight">Bodyweight</SelectItem>
                        <SelectItem value="weighted">Weighted</SelectItem>
                        <SelectItem value="HIIT">HIIT</SelectItem>
                        <SelectItem value="bodyweight+cardio">Bodyweight+Cardio</SelectItem>
                        <SelectItem value="weighted+cardio">Weighted+Cardio</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="2"
                        max="6"
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
                name="totalDurationMins"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Duration (mins)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="30"
                        max="120"
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
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
             
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Any additional notes"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg px-8 py-3 rounded-full shadow-lg transition flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading && (
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
                )}
                {loading ? "Generating..." : "Create Workout Plan"}
              </Button>
              {loading && (
                <div className="w-full flex flex-col items-center mt-4">
                  <span className="text-orange-600 font-medium text-base animate-pulse text-center">
                    {loadingMsg}
                  </span>
                </div>
              )}
            </form>
          </Form>

          {/* Workout Plan Table */}

          {workoutPlan && workoutPlan.length > 0 && (
          <div>{JSON.stringify(workoutPlan)}</div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default withAuth(CreateWorkoutPlanPage);
