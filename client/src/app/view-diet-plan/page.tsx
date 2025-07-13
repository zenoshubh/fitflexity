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

    if (editMode && selectedMealIdx !== null && dietPlan && Array.isArray(dietPlan)) {
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
          <div className="w-full max-w-lg bg-white/80 backdrop-blur-lg border border-gray-200 rounded-3xl shadow-2xl p-6 mb-8">
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
              <div className="w-full">
                <Table className="w-full border border-orange-200 bg-white/80 rounded-xl text-xs">
                  <TableHeader>
                    <TableRow className="bg-orange-500 text-white">
                      {editMode && <TableHead className="border px-1 py-1"></TableHead>}
                      <TableHead className="border px-1 py-1">#</TableHead>
                      <TableHead className="border px-1 py-1">Meal</TableHead>
                      <TableHead className="border px-1 py-1">Menu</TableHead>
                      <TableHead className="border px-1 py-1">Qty</TableHead>
                      <TableHead className="border px-1 py-1">Protein</TableHead>
                      <TableHead className="border px-1 py-1">Carbs</TableHead>
                      <TableHead className="border px-1 py-1">Fats</TableHead>
                      <TableHead className="border px-1 py-1">Fibers</TableHead>
                      <TableHead className="border px-1 py-1">Cal</TableHead>
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
                        const total = meal.Total || meal.total;
                        return (
                          <TableRow key="total" className="bg-orange-100 font-bold">
                            {editMode && <TableCell className="border px-2 py-1"></TableCell>}
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

                      // Only show select on first row of each meal
                      return (meal as Meal).items?.map(
                        (item: MealItem, idx: number) => (
                          <TableRow
                            key={`${meal.mealNumber}-${idx}`}
                            className={
                              editMode && selectedMealIdx === mealIdx
                                ? "bg-orange-50"
                                : ""
                            }
                          >
                            {editMode && idx === 0 && (
                              <TableCell
                                className="border px-2 py-1 text-center align-middle"
                                rowSpan={(meal as Meal).items.length}
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
                            {editMode && idx !== 0 && null}
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
                          disabled={loading || (editMode && selectedMealIdx === null) || updating}
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
