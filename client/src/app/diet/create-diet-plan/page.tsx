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

// Zod schema for TableHeade form
const formSchema = z.object({
  dietType: dietTypeEnum,
  desiredWeight: z
    .number()
    .min(0, { message: "Desired weight is required" })
    .nonnegative(),
  intolerancesAndAllergies: z
    .string()
    .max(100, { message: "Max 100 characters allowed" }),
  excludedFoods: z.string().max(100, { message: "Max 100 characters allowed" }),
  numberOfMeals: z.number().max(6, { message: "Max 6 meals allowed" }),
  numberOfMealOptions: z
    .number()
    .min(1, { message: "At least 1 meal option is required" })
    .max(3, { message: "Max 3 meal options allowed" }),
  goalDurationDays: z
    .number()
    .min(7, { message: "Goal duration must be at least 7 days" })
    .max(365, { message: "Goal duration cannot exceed 365 days" }),

  notes: z.string().max(200, { message: "Max 200 characters allowed" }),
});

const CreateDietPlanPage = () => {
  const [dietPlan, setDietPlan] = useState<any[] | undefined>([]);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Generating your diet plan...");
  const loadingMessages = [
    "Calculating your macros and calories...",
    "Selecting the best meal combinations...",
    "AI is generating your personalized meals...",
    "Balancing nutrition and preferences...",
    "Almost done! Finalizing your plan...",
  ];

  type FormSchemaType = z.infer<typeof formSchema>;
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dietType: "vegetarian",
      desiredWeight: 0,
      intolerancesAndAllergies: "",
      excludedFoods: "",
      numberOfMeals: 3, // Default to 3 meals
      numberOfMealOptions: 2, // Default to 2 meal options per meal
      goalDurationDays: 30,
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

      const response = await api.post("/diet/generate-diet-plan", {
        ...values,
        userId: user?.id,
      });

      const { status, data, message } = response.data;

      if (status == 200) {
        setDietPlan(data.plan);
        toast.success(`${message}`);
        console.log(dietPlan);
      } else {
        setDietPlan(undefined);
        toast.error(`Failed to create diet plan: ${message}`);
      }
    } catch (error: any) {
      setDietPlan(undefined);
      console.error("Error creating diet plan:", error);
      toast.error(`${error?.response?.data?.message}`);
    } finally {
      if (interval) clearInterval(interval);
      setLoading(false);
      setLoadingMsg(loadingMessages[0]);
    }
  }

  if (!user) return <Loader />;

  // Helper to check if a row is TableHeade "Total" row
  const isTotalRow = (row: any) =>
    row.mealNumber === undefined &&
    row.mealName === undefined &&
    row.items === undefined &&
    row.Total !== undefined;

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
            Create Your Diet Plan
          </h1>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 w-full"
            >
              <FormField
                control={form.control}
                name="dietType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diet Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select diet type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="eggetarian">Eggetarian</SelectItem>
                        <SelectItem value="nonvegetarian">
                          Non-Vegetarian
                        </SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                        <SelectItem value="keto">Keto</SelectItem>
                        <SelectItem value="paleo">Paleo</SelectItem>
                        <SelectItem value="mediterranean">
                          Mediterranean
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="intolerancesAndAllergies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Food Intolerances and Allergies</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. nuts, dairy"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="excludedFoods"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excluded Foods</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. gluten, soy"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfMeals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Meals</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
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
                name="numberOfMealOptions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Meal Options</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="3"
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
                {loading ? "Generating..." : "Create Diet Plan"}
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

          {/* Diet Plan Table */}
          {dietPlan && Array.isArray(dietPlan) && dietPlan.length > 0 && (
            <div className="overflow-x-auto mt-10 w-full">
              <h2 className="text-xl font-bold mb-4 text-center">
                Generated Diet Plan
              </h2>
              <Table className="min-w-full border border-gray-300 bg-white">
                <TableHeader>
                  <TableRow className="bg-orange-500 text-white">
                    <TableHead className="border px-2 py-1">
                      Meal Number
                    </TableHead>
                    <TableHead className="border px-2 py-1">
                      Meal Name
                    </TableHead>
                    <TableHead className="border px-2 py-1">Menu</TableHead>
                    <TableHead className="border px-2 py-1">Qty</TableHead>
                    <TableHead className="border px-2 py-1">Protein</TableHead>
                    <TableHead className="border px-2 py-1">Carbs</TableHead>
                    <TableHead className="border px-2 py-1">Fats</TableHead>
                    <TableHead className="border px-2 py-1">Fibers</TableHead>
                    <TableHead className="border px-2 py-1">Calories</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dietPlan.map((meal, mealIdx) => {
                    // Handle "Total" row if present
                    if (
                      meal.mealNumber === undefined &&
                      meal.mealName === undefined &&
                      meal.items === undefined &&
                      (meal.Total || meal.total)
                    ) {
                      // Support boTableHead "Total" and "total" keys
                      const total = meal.Total || meal.total;
                      return (
                        <TableRow
                          key="total"
                          className="bg-orange-100 font-bold"
                        >
                          <TableCell
                            className="border px-2 py-1 text-center"
                            colSpan={4}
                          >
                            Total
                          </TableCell>
                          <TableCell className="border px-2 py-1">
                            {total.protein || ""}
                          </TableCell>
                          <TableCell className="border px-2 py-1 ">
                            {total.carbs || ""}
                          </TableCell>
                          <TableCell className="border px-2 py-1 ">
                            {total.fats || ""}
                          </TableCell>
                          <TableCell className="border px-2 py-1 ">
                            {total.fibers || ""}
                          </TableCell>
                          <TableCell className="border px-2 py-1 ">
                            {total.calories || ""}
                          </TableCell>
                        </TableRow>
                      );
                    }

                    // Render meal rows
                    // Define interfaces for TableHeade meal items and structure
                    interface MealItem {
                      name: string;
                      qty: string | number;
                      protein: string | number;
                      carbs: string | number;
                      fats: string | number;
                      fibers: string | number;
                      calories: string | number;
                    }

                    interface Meal {
                      mealNumber: string | number;
                      mealName: string;
                      items: MealItem[];
                    }

                    return (meal as Meal).items?.map(
                      (item: MealItem, idx: number) => (
                        <TableRow key={`${meal.mealNumber}-${idx}`}>
                          {idx === 0 && (
                            <>
                              <TableCell
                                className="border px-2 py-1 text-center"
                                rowSpan={(meal as Meal).items.length}
                              >
                                {meal.mealNumber}
                              </TableCell>
                              <TableCell
                                className="border px-2 py-1 text-center"
                                rowSpan={(meal as Meal).items.length}
                              >
                                {meal.mealName}
                              </TableCell>
                            </>
                          )}
                          <TableCell className="border px-2 py-1">
                            {item.name}
                          </TableCell>
                          <TableCell className="border px-2 py-1">
                            {item.qty}
                          </TableCell>
                          <TableCell className="border px-2 py-1">
                            {item.protein}
                          </TableCell>
                          <TableCell className="border px-2 py-1">
                            {item.carbs}
                          </TableCell>
                          <TableCell className="border px-2 py-1">
                            {item.fats}
                          </TableCell>
                          <TableCell className="border px-2 py-1">
                            {item.fibers}
                          </TableCell>
                          <TableCell className="border px-2 py-1">
                            {item.calories}
                          </TableCell>
                        </TableRow>
                      )
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default withAuth(CreateDietPlanPage);
