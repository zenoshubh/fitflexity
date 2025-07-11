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
const dietGoalEnum = z.enum(["weight_loss", "muscle_gain", "maintenance"]);

// Zod schema for TableHeade form
const formSchema = z.object({
  dietType: dietTypeEnum,
  goal: dietGoalEnum,
  desiredWeight: z
    .number()
    .min(0, { message: "Desired weight is required" })
    .nonnegative(),
  intolerancesAndAllergies: z
    .string()
    .max(100, { message: "Max 100 characters allowed" }),
  excludedFoods: z.string().max(100, { message: "Max 100 characters allowed" }),
  numberOfMeals: z.number().max(6, { message: "Max 6 meals allowed" }),
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dietType: "vegetarian",
      goal: "maintenance",
      desiredWeight: 0,
      intolerancesAndAllergies: "",
      excludedFoods: "",
      numberOfMeals: 3, // Default to 3 meals
      goalDurationDays: 30,
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
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
      // Optionally, you can show an error message to TableHeade user
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
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 max-w-xl mx-auto"
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
                    <SelectItem value="mediterranean">Mediterranean</SelectItem>
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight_loss">Weight Loss</SelectItem>
                    <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="desiredWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Desired Weight (kg)</FormLabel>
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
            name="goalDurationDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Goal Duration (days)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="7"
                    max="365"
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
          <Button type="submit" className="w-full">
            Create Diet Plan
          </Button>
        </form>
      </Form>

      {/* Diet Plan Table */}
      {dietPlan && Array.isArray(dietPlan) && (
        <div className="overflow-x-auto mt-10">
          <h2 className="text-xl font-bold mb-4 text-center">
            Generated Diet Plan
          </h2>
          <Table className="min-w-full border border-gray-300 bg-white">
            <TableHeader>
              <TableRow className="bg-green-600 text-white">
                <TableHead className="border px-2 py-1">Meal Number</TableHead>
                <TableHead className="border px-2 py-1">Meal Name</TableHead>
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
                    <TableRow key="total" className="bg-green-200 font-bold">
                      <TableCell
                        className="border px-2 py-1 text-center"
                        colSpan={4}
                      >
                        Total
                      </TableCell>
                      {/* <TableCell className="border px-2 py-1 text-center">
                        {total.weight || ""}
                      </TableCell> */}
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
    </>
  );
};

export default withAuth(CreateDietPlanPage);
