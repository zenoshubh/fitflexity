"use client";

import withAuth from "@/components/withAuth";
import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Markdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HEADER_HEIGHT = 76;
const FOOTER_HEIGHT = 56;

// Chat form type
type ChatFormValues = {
  chatQuery: string;
};

const ViewDietPlan = () => {
  const [dietPlan, setDietPlan] = useState<any[] | undefined>([]);
  const [chatResponse, setChatResponse] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string>("");
  const [editMode, setEditMode] = useState(false);
  const [selectedMealIdx, setSelectedMealIdx] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [optionSelections, setOptionSelections] = useState<{
    [mealIdx: number]: number;
  }>({});

  // Chat form
  const form = useForm<ChatFormValues>({
    defaultValues: {
      chatQuery: "",
    },
  });

  // Fetch diet plan
  const fetchDietPlan = async () => {
    try {
      const response = await api.get("/diet/get-diet-plan");
      const { status, data, message } = response.data;
      if (status === 200) {
        setDietPlan(data.plan);
      } else {
        toast.error(message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch diet plan");
    }
  };

  useEffect(() => {
    fetchDietPlan();
  }, []);

  // Chat handler (normal and edit mode)
  const handleChat = async (values: ChatFormValues) => {
    setLoading(true);
    setChatResponse(null);

    if (
      editMode &&
      selectedMealIdx !== null &&
      dietPlan &&
      Array.isArray(dietPlan)
    ) {
      // Edit mode: update meal
      setUpdating(true);
      try {
        const selectedMeal = dietPlan[selectedMealIdx];
        const res = await api.put("/diet/update-diet-plan", {
          meal: selectedMeal,
          updateInstruction: values.chatQuery,
        });
        const { status, data, message } = res.data;
        if (status === 200 && data && data.plan) {
          setDietPlan(data.plan);
          toast.success(message || "Meal updated successfully.");
          setSelectedMealIdx(null);
          form.reset();
        } else {
          toast.error(message || "Failed to update meal.");
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Something went wrong.");
      }
      setUpdating(false);
      setLoading(false);
      return;
    }

    // Normal chat
    try {
      const res = await api.post("/diet/chat-diet-plan", {
        question: values.chatQuery,
      });
      const { status, data, message } = res.data;
      if (status == 200) {
        setChatResponse(data || "No relevant information found.");
        setAnswer(data.answer);
        toast.success(message || "Response received successfully.");
      }
    } catch (err: any) {
      setChatResponse("Something went wrong.");
      toast.error(err.response?.data?.message || "Something went wrong.");
    }
    setLoading(false);
  };

  // Handle meal option selection
  const handleOptionChange = (mealIdx: number, optIdx: number) => {
    setOptionSelections((prev) => ({ ...prev, [mealIdx]: optIdx }));
  };

  // Calculate totals for currently selected options
  const calculateTotals = () => {
    if (!dietPlan || !Array.isArray(dietPlan))
      return { protein: 0, carbs: 0, fats: 0, fibers: 0, calories: 0 };
    let totals = { protein: 0, carbs: 0, fats: 0, fibers: 0, calories: 0 };
    dietPlan.forEach((meal: any, mealIdx: number) => {
      const optIdx = optionSelections[mealIdx] ?? 0;
      const option = meal.mealOptions?.[optIdx];
      if (option && Array.isArray(option.items)) {
        option.items.forEach((item: any) => {
          totals.protein += Number(item.protein) || 0;
          totals.carbs += Number(item.carbs) || 0;
          totals.fats += Number(item.fats) || 0;
          totals.fibers += Number(item.fibers) || 0;
          totals.calories += Number(item.calories) || 0;
        });
      }
    });
    // Round to 1 decimal
    Object.keys(totals).forEach((k) => {
      // @ts-ignore
      totals[k] = Math.round((totals[k] + Number.EPSILON) * 10) / 10;
    });
    return totals;
  };

  const totals = calculateTotals();

  // Calculate approx macro/calorie intake ranges (min-max, rounded to nearest 10/100)
  const calculateApproxRanges = () => {
    if (!dietPlan || !Array.isArray(dietPlan)) return null;
    let totalMin = { protein: 0, carbs: 0, fats: 0, fibers: 0, calories: 0 };
    let totalMax = { protein: 0, carbs: 0, fats: 0, fibers: 0, calories: 0 };

    dietPlan.forEach((meal: any) => {
      if (!Array.isArray(meal.mealOptions) || meal.mealOptions.length === 0)
        return;

      let mealOptionMacros = meal.mealOptions.map((option: any) => {
        let macros = { protein: 0, carbs: 0, fats: 0, fibers: 0, calories: 0 };
        if (Array.isArray(option.items)) {
          option.items.forEach((item: any) => {
            macros.protein += Number(item.protein) || 0;
            macros.carbs += Number(item.carbs) || 0;
            macros.fats += Number(item.fats) || 0;
            macros.fibers += Number(item.fibers) || 0;
            macros.calories += Number(item.calories) || 0;
          });
        }
        return macros;
      });

      // Find min/max for each macro for this meal
      let min = {
        protein: Infinity,
        carbs: Infinity,
        fats: Infinity,
        fibers: Infinity,
        calories: Infinity,
      };
      let max = {
        protein: -Infinity,
        carbs: -Infinity,
        fats: -Infinity,
        fibers: -Infinity,
        calories: -Infinity,
      };

      mealOptionMacros.forEach((m: any) => {
        min.protein = Math.min(min.protein, m.protein);
        min.carbs = Math.min(min.carbs, m.carbs);
        min.fats = Math.min(min.fats, m.fats);
        min.fibers = Math.min(min.fibers, m.fibers);
        min.calories = Math.min(min.calories, m.calories);

        max.protein = Math.max(max.protein, m.protein);
        max.carbs = Math.max(max.carbs, m.carbs);
        max.fats = Math.max(max.fats, m.fats);
        max.fibers = Math.max(max.fibers, m.fibers);
        max.calories = Math.max(max.calories, m.calories);
      });

      // If no options, treat as 0
      if (!isFinite(min.protein))
        min = { protein: 0, carbs: 0, fats: 0, fibers: 0, calories: 0 };
      if (!isFinite(max.protein))
        max = { protein: 0, carbs: 0, fats: 0, fibers: 0, calories: 0 };

      totalMin.protein += min.protein;
      totalMin.carbs += min.carbs;
      totalMin.fats += min.fats;
      totalMin.fibers += min.fibers;
      totalMin.calories += min.calories;

      totalMax.protein += max.protein;
      totalMax.carbs += max.carbs;
      totalMax.fats += max.fats;
      totalMax.fibers += max.fibers;
      totalMax.calories += max.calories;
    });

    // Round macros to nearest 10, calories to nearest 100
    const roundMacro = (val: number) => Math.round(val / 10) * 10;
    const roundCal = (val: number) => Math.round(val / 100) * 100;

    return {
      protein: `${roundMacro(totalMin.protein)} - ${roundMacro(
        totalMax.protein
      )}`,
      carbs: `${roundMacro(totalMin.carbs)} - ${roundMacro(totalMax.carbs)}`,
      fats: `${roundMacro(totalMin.fats)} - ${roundMacro(totalMax.fats)}`,
      fibers: `${roundMacro(totalMin.fibers)} - ${roundMacro(totalMax.fibers)}`,
      calories: `${roundCal(totalMin.calories)} - ${roundCal(
        totalMax.calories
      )}`,
    };
  };

  const approxRanges = calculateApproxRanges();

  // Helper for meal selection in edit mode
  const handleMealSelect = (idx: number) => {
    setSelectedMealIdx(idx === selectedMealIdx ? null : idx);
  };

  // Responsive, modern, glassy layout
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
        className="flex-1 flex flex-col md:flex-row items-start justify-center px-4 py-12 md:py-20 max-w-7xl mx-auto w-full gap-8"
        style={{
          paddingTop: `${HEADER_HEIGHT}px`,
          paddingBottom: `${FOOTER_HEIGHT + 32}px`,
        }}
      >
        {/* Diet Plan Table Section */}
        <div className="flex-1 flex flex-col items-center">
          <div
            className="w-full bg-white/80 backdrop-blur-lg border border-gray-200 rounded-3xl shadow-2xl p-6 mb-8"
            style={{
              maxWidth: "100%",
              minWidth: 0,
              overflow: "visible",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-extrabold text-orange-700 text-center tracking-tight">
                Your Diet Plan
              </h2>
              <label className="flex items-center gap-2 text-sm font-medium text-orange-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editMode}
                  onChange={() => {
                    setEditMode((v) => !v);
                    setSelectedMealIdx(null);
                  }}
                  className="accent-orange-500 w-4 h-4"
                />
                Edit Diet Plan Mode
              </label>
            </div>
            {dietPlan && Array.isArray(dietPlan) ? (
              <div
                className="w-full"
                style={{
                  overflowX: "auto",
                  maxHeight: "none",
                  minHeight: 0,
                }}
              >
                <Table
                  className="w-full border border-orange-200 bg-white/80 rounded-xl text-xs"
                  style={{
                    tableLayout: "auto",
                    width: "100%",
                    minWidth: 900,
                  }}
                >
                  <TableHeader>
                    <TableRow className="bg-orange-500 text-white">
                      {editMode && (
                        <TableHead className="border px-1 py-1"></TableHead>
                      )}
                      <TableHead className="border px-1 py-1">#</TableHead>
                      <TableHead className="border px-1 py-1">Meal</TableHead>
                      <TableHead className="border px-1 py-1">Option</TableHead>
                      <TableHead className="border px-1 py-1">Menu</TableHead>
                      <TableHead className="border px-1 py-1">Qty</TableHead>
                      <TableHead className="border px-1 py-1">
                        Protein
                      </TableHead>
                      <TableHead className="border px-1 py-1">Carbs</TableHead>
                      <TableHead className="border px-1 py-1">Fats</TableHead>
                      <TableHead className="border px-1 py-1">Fibers</TableHead>
                      <TableHead className="border px-1 py-1">Cal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dietPlan.map((meal, mealIdx) => {
                      if (!meal.mealOptions || !Array.isArray(meal.mealOptions))
                        return null;
                      const selectedOptIdx = optionSelections[mealIdx] ?? 0;
                      const selectedOption = meal.mealOptions[selectedOptIdx];

                      // For edit mode: select meal (checkbox only on first row)
                      const totalRows = selectedOption?.items?.length || 1;

                      return selectedOption?.items?.map(
                        (item: any, itemIdx: number) => (
                          <TableRow
                            key={`${meal.mealNumber}-${selectedOptIdx}-${itemIdx}`}
                            className={
                              editMode && selectedMealIdx === mealIdx
                                ? "bg-orange-50"
                                : ""
                            }
                          >
                            {/* Edit mode: select meal (only on first row) */}
                            {editMode && itemIdx === 0 && (
                              <TableCell
                                className="border px-2 py-1 text-center align-middle"
                                rowSpan={totalRows}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedMealIdx === mealIdx}
                                  onChange={() => handleMealSelect(mealIdx)}
                                  className="accent-orange-500 w-5 h-5"
                                  disabled={updating}
                                />
                              </TableCell>
                            )}
                            {editMode && itemIdx !== 0 && null}
                            {/* Meal number and name (only on first row) */}
                            {itemIdx === 0 && (
                              <>
                                <TableCell
                                  className="border px-2 py-1 text-center"
                                  rowSpan={totalRows}
                                >
                                  {meal.mealNumber}
                                </TableCell>
                                <TableCell
                                  className="border px-2 py-1 text-center"
                                  rowSpan={totalRows}
                                >
                                  {meal.mealName}
                                </TableCell>
                                {/* Option selector */}
                                <TableCell
                                  className="border max-w-[80px] px-1 py-1 text-center"
                                  rowSpan={totalRows}
                                >
                                  <Select
                                    value={String(selectedOptIdx)}
                                    onValueChange={(val) =>
                                      handleOptionChange(mealIdx, Number(val))
                                    }
                                    disabled={editMode}
                                  >
                                    <SelectTrigger className="w-28 bg-orange-50 border-orange-200 rounded-md text-xs">
                                      <SelectValue
                                        placeholder={`Option ${
                                          selectedOptIdx + 1
                                        }`}
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {meal.mealOptions.map(
                                        (_: any, idx: number) => (
                                          <SelectItem
                                            key={idx}
                                            value={String(idx)}
                                          >
                                            Option {idx + 1}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                              </>
                            )}
                            {itemIdx !== 0 && null}
                            {/* Item details */}
                            <TableCell className="border px-2 py-1 break-words whitespace-pre-line max-w-[120px]">
                              {item.name}
                            </TableCell>
                            <TableCell className="border px-2 py-1 break-words whitespace-pre-line max-w-[80px]">
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
                    {/* Totals row */}
                    <TableRow className="bg-orange-100 font-semibold border-t-2 border-orange-300">
                      {editMode && (
                        <TableCell className="border px-2 py-1"></TableCell>
                      )}
                      <TableCell
                        className="border px-2 py-1 text-center"
                        colSpan={5}
                      >
                        Totals
                      </TableCell>
                      <TableCell className="border px-2 py-1">
                        {totals.protein}
                      </TableCell>
                      <TableCell className="border px-2 py-1">
                        {totals.carbs}
                      </TableCell>
                      <TableCell className="border px-2 py-1">
                        {totals.fats}
                      </TableCell>
                      <TableCell className="border px-2 py-1">
                        {totals.fibers}
                      </TableCell>
                      <TableCell className="border px-2 py-1">
                        {totals.calories}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  <span className="inline-block bg-orange-50 px-3 py-1 rounded-full border border-orange-100 shadow-sm">
                    Change meal options above to see updated totals.
                  </span>
                </div>
                {/* Approximate Macros/Calories Card */}
                {approxRanges && (
                  <div className="w-full max-w-lg mx-auto mb-6">
                    <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 shadow p-5 flex flex-col gap-2">
                      <div className="text-lg font-bold text-orange-700 mb-1">
                        Approximate Daily Intake (Range)
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm justify-between">
                        <div>
                          <span className="font-semibold text-orange-600">
                            Protein:
                          </span>{" "}
                          {approxRanges.protein} g
                        </div>
                        <div>
                          <span className="font-semibold text-orange-600">
                            Carbs:
                          </span>{" "}
                          {approxRanges.carbs} g
                        </div>
                        <div>
                          <span className="font-semibold text-orange-600">
                            Fats:
                          </span>{" "}
                          {approxRanges.fats} g
                        </div>
                        <div>
                          <span className="font-semibold text-orange-600">
                            Fibers:
                          </span>{" "}
                          {approxRanges.fibers} g
                        </div>
                        <div>
                          <span className="font-semibold text-orange-600">
                            Calories:
                          </span>{" "}
                          {approxRanges.calories} kcal
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Calculated as the sum of minimum and maximum
                        macros/calories for each meal (across all options).
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500">Loading...</p>
            )}
          </div>
        </div>
        {/* Chat Section */}
        <div className="w-full md:max-w-md flex flex-col">
          <div className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-3xl shadow-xl p-8 flex flex-col h-full min-h-[340px]">
            <h3 className="text-lg font-bold mb-4 text-orange-700 text-center tracking-tight">
              {editMode ? "Edit Selected Meal" : "Ask About Your Diet Plan"}
            </h3>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleChat)}
                className="flex flex-col gap-4 mb-4"
              >
                <FormField
                  control={form.control}
                  name="chatQuery"
                  rules={{ required: "Please enter your question" }}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <textarea
                          rows={4}
                          placeholder={
                            editMode
                              ? selectedMealIdx !== null
                                ? "Describe the changes you want in this meal..."
                                : "Select a meal to edit"
                              : "Ask about your diet plan..."
                          }
                          disabled={
                            loading ||
                            (editMode && selectedMealIdx === null) ||
                            updating
                          }
                          className="w-full rounded-xl border-orange-200 focus:border-orange-400 focus:ring-orange-300 bg-white/80 p-3 resize-none text-base"
                          style={{ minHeight: 80 }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    updating ||
                    !form.watch("chatQuery").trim() ||
                    (editMode && selectedMealIdx === null)
                  }
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 py-3 text-base font-semibold"
                >
                  {updating
                    ? "Updating..."
                    : loading
                    ? editMode
                      ? "Updating..."
                      : "Asking..."
                    : editMode
                    ? "Update Meal"
                    : "Ask"}
                </Button>
              </form>
            </Form>
            {chatResponse && !editMode && (
              <div className="flex-1 overflow-y-auto mt-2">
                <div className="bg-orange-50/80 border-0 shadow-none rounded-xl p-4">
                  <Markdown>{answer}</Markdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default withAuth(ViewDietPlan);
