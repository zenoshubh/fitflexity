"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import withAuth from "@/components/withAuth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";

// Enums as per schema
const dietTypeEnum = z.enum([
  "vegetarian",
  "vegan",
  "keto",
  "paleo",
  "mediterranean",
  "custom",
]);
const dietGoalEnum = z.enum(["weight_loss", "muscle_gain", "maintenance"]);

// Zod schema for the form
const formSchema = z.object({
  dietType: dietTypeEnum,
  goal: dietGoalEnum,
  desiredWeight: z
    .number()
    .min(0, { message: "Desired weight is required" })
    .nonnegative(),
});

const CreateDietPlanPage = () => {
  const [dietPlan, setDietPlan] = useState<any[] | undefined>([]);
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dietType: "custom",
      goal: "maintenance",
      desiredWeight: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await api.post("/diet/generate-diet-plan", {
        ...values,
        userId: user?.id,
      });

      console.log(response);

      if (response?.status == 200) {
        setDietPlan(response.data.data.plan);
        console.log(dietPlan);
      } else {
        setDietPlan(undefined);
        console.error("Failed to create diet plan", response.data);
      }
    } catch (error) {
      setDietPlan(undefined);
      console.error("Error creating diet plan:", error);
      // Optionally, you can show an error message to the user
    }
  }

  if (!user) return <Loader />;

  // Helper to check if a row is the "Total" row
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
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="keto">Keto</SelectItem>
                    <SelectItem value="paleo">Paleo</SelectItem>
                    <SelectItem value="mediterranean">Mediterranean</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
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
          <table className="min-w-full border border-gray-300 bg-white">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="border px-2 py-1">Meal Number</th>
                <th className="border px-2 py-1">Meal Name</th>
                <th className="border px-2 py-1">Menu</th>
                <th className="border px-2 py-1">Qty</th>
                <th className="border px-2 py-1">Protein</th>
                <th className="border px-2 py-1">Carbs</th>
                <th className="border px-2 py-1">Fats</th>
                <th className="border px-2 py-1">Fibers</th>
                <th className="border px-2 py-1">Calories</th>
              </tr>
            </thead>
            <tbody>
              {dietPlan.map((meal, mealIdx) => {
                // Handle "Total" row if present
                if (
                  meal.mealNumber === undefined &&
                  meal.mealName === undefined &&
                  meal.items === undefined &&
                  (meal.Total || meal.total)
                ) {
                  // Support both "Total" and "total" keys
                  const total = meal.Total || meal.total;
                  return (
                    <tr key="total" className="bg-green-200 font-bold">
                      <td className="border px-2 py-1 text-center" colSpan={2}>
                        Total
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {total.weight || ""}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {total.protein || ""}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {total.carbs || ""}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {total.fats || ""}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {total.fibers || ""}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {total.calories || ""}
                      </td>
                      <td className="border px-2 py-1 text-center"></td>
                    </tr>
                  );
                }

                // Render meal rows
                // Define interfaces for the meal items and structure
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
                    <tr key={`${meal.mealNumber}-${idx}`}>
                      {idx === 0 && (
                        <>
                          <td
                            className="border px-2 py-1 text-center"
                            rowSpan={(meal as Meal).items.length}
                          >
                            {meal.mealNumber}
                          </td>
                          <td
                            className="border px-2 py-1 text-center"
                            rowSpan={(meal as Meal).items.length}
                          >
                            {meal.mealName}
                          </td>
                        </>
                      )}
                      <td className="border px-2 py-1">{item.name}</td>
                      <td className="border px-2 py-1">{item.qty}</td>
                      <td className="border px-2 py-1">{item.protein}</td>
                      <td className="border px-2 py-1">{item.carbs}</td>
                      <td className="border px-2 py-1">{item.fats}</td>
                      <td className="border px-2 py-1">{item.fibers}</td>
                      <td className="border px-2 py-1">{item.calories}</td>
                    </tr>
                  )
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default withAuth(CreateDietPlanPage);
