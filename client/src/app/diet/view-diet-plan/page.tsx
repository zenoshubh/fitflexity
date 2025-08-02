"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import withAuth from "@/components/withAuth";
import api from "@/lib/api";
import { Send, Edit3, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Markdown from "react-markdown";

type ChatFormValues = {
  chatQuery: string;
};

const ViewDietPlanPage = () => {
  const [dietPlan, setDietPlan] = useState<any[] | undefined>([]);
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Track selected option index for each meal
  const [selectedOptions, setSelectedOptions] = useState<{
    [mealIdx: number]: number;
  }>({});

  // --- Edit Mode State ---
  const [editMode, setEditMode] = useState(false);
  const [selectedMealIdx, setSelectedMealIdx] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);

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

  const form = useForm<ChatFormValues>({
    defaultValues: {
      chatQuery: "",
    },
  });

  // --- Chat and Edit Handlers ---
  const handleChat = async (values: ChatFormValues) => {
    setChatLoading(true);
    setChatResponse(null);

    // Edit mode: update meal
    if (
      editMode &&
      selectedMealIdx !== null &&
      dietPlan &&
      Array.isArray(dietPlan)
    ) {
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
      setChatLoading(false);
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
    } finally {
      setChatLoading(false);
    }
  };

  const handleDeleteDietPlan = async () => {
    if (!dietPlan || !Array.isArray(dietPlan) || dietPlan.length === 0) return;
    setDeleting(true);
    try {
      await api.delete("/diet/delete-diet-plan");
      setDietPlan([]);
      toast.success("Diet plan deleted successfully.");
      setSelectedMealIdx(null);
      form.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete diet plan");
    } finally {
      setDeleting(false);
    }
  };

  // --- UI ---
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
      <main className="flex-1 w-full pt-6 pb-6 md:pt-12 md:pb-12">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 max-w-7xl mx-auto px-1 sm:px-2 md:px-8 h-auto md:h-[calc(100vh-96px)]">
          {/* Diet Plan Section */}
          <section className="flex-1 h-full flex flex-col min-h-0">
            <div
              className="h-full w-full bg-white/80 backdrop-blur-lg border border-gray-200 rounded-3xl shadow-2xl p-3 sm:p-4 md:p-6 flex-1 flex flex-col min-h-0"
              style={{
                maxWidth: "100%",
                minWidth: 0,
                overflow: "visible",
              }}
            >
              <div className="flex sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-orange-700 text-center tracking-tight">
                  Your Diet Plan
                </h2>
                <div className="flex gap-2">
                  {/* Edit Mode Toggle */}
                  <button
                    className={`flex items-center gap-2 text-sm font-medium text-orange-700 px-3 py-1 rounded-full transition
                      ${editMode ? "bg-orange-100 shadow" : "hover:bg-orange-50"}
                    `}
                    onClick={() => {
                      setEditMode((v) => !v);
                      setSelectedMealIdx(null);
                      form.reset();
                    }}
                    type="button"
                  >
                    <Edit3
                      className={`transition ${
                        editMode ? "text-orange-500" : "text-orange-300"
                      }`}
                      size={20}
                    />
                    <span className="hidden md:inline">Edit Diet Plan</span>
                  </button>
                  {/* Delete Diet Plan Button */}
                  <button
                    type="button"
                    className={`flex items-center gap-2 text-sm font-medium text-orange-700 px-3 py-1 rounded-full transition
                      bg-orange-50 hover:bg-orange-100 border border-orange-200 shadow-sm
                      ${deleting ? "opacity-60 cursor-not-allowed" : ""}
                    `}
                    onClick={handleDeleteDietPlan}
                    disabled={deleting || !dietPlan || dietPlan.length === 0}
                    aria-label="Delete Diet Plan"
                  >
                    <Trash2
                      size={18}
                      className="text-orange-400"
                    />
                    <span className="hidden md:inline">
                      {deleting ? "Deleting..." : "Delete Diet Plan"}
                    </span>
                  </button>
                </div>
              </div>
              {/* Only render Accordion if there are meals */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-0 md:pr-2">
                {dietPlan && Array.isArray(dietPlan) && dietPlan.length > 0 ? (
                  <Accordion type="multiple" className="mb-4">
                    {dietPlan
                      .filter(
                        (meal: any) =>
                          meal &&
                          meal.mealOptions &&
                          Array.isArray(meal.mealOptions) &&
                          meal.mealOptions.length > 0
                      )
                      .map((meal: any, mealIdx: number) => (
                        <AccordionItem
                          value={String(meal.mealNumber)}
                          key={mealIdx}
                          className={`rounded-2xl border border-orange-100 bg-white/90 shadow-md transition mb-4
                            ${
                              editMode && selectedMealIdx === mealIdx
                                ? "ring-2 ring-orange-200"
                                : ""
                            }
                          `}
                        >
                          <AccordionTrigger className="w-full flex items-center justify-between px-5 py-4 rounded-2xl focus:outline-none text-lg font-bold text-orange-700">
                            {/* Only meal name here, no nested button */}
                            <span>{meal.mealName}</span>
                          </AccordionTrigger>
                          <AccordionContent className="px-2 sm:px-6 pb-5">
                            {/* Edit meal select button - placed at top of content */}
                            {editMode && (
                              <div className="mb-3 flex">
                                <button
                                  type="button"
                                  className={`rounded-full p-1 border-2 transition
                                    ${
                                      selectedMealIdx === mealIdx
                                        ? "border-orange-500 bg-orange-100"
                                        : "border-orange-200 bg-white"
                                    }
                                  `}
                                  onClick={() => {
                                    if (selectedMealIdx === mealIdx) {
                                      setSelectedMealIdx(null);
                                    } else {
                                      setSelectedMealIdx(mealIdx);
                                      form.reset();
                                      setChatResponse(null);
                                    }
                                  }}
                                  disabled={updating}
                                  aria-label="Select meal to edit"
                                >
                                  <Edit3
                                    size={18}
                                    className={`transition cursor-pointer ${
                                      selectedMealIdx === mealIdx
                                        ? "text-orange-500"
                                        : "text-orange-300"
                                    }`}
                                  />
                                </button>
                                <span className="ml-2 text-sm text-orange-700 font-medium self-center">
                                  {selectedMealIdx === mealIdx
                                    ? "Selected for edit"
                                    : "Edit this meal"}
                                </span>
                              </div>
                            )}
                            {/* Option Tabs */}
                            {meal.mealOptions && meal.mealOptions.length > 0 ? (
                              <div>
                                <Tabs
                                  value={String(selectedOptions[mealIdx] ?? 0)}
                                  onValueChange={(val) =>
                                    setSelectedOptions((prev) => ({
                                      ...prev,
                                      [mealIdx]: Number(val),
                                    }))
                                  }
                                >
                                  <TabsList className="mb-4 flex gap-2 bg-orange-50 rounded-full p-1 overflow-x-auto scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent">
                                    {meal.mealOptions.map(
                                      (_: any, optionIdx: number) => (
                                        <TabsTrigger
                                          key={optionIdx}
                                          value={String(optionIdx)}
                                          className={`px-3 sm:px-4 py-1 rounded-full border text-xs font-semibold transition whitespace-nowrap
                                            ${
                                              (selectedOptions[mealIdx] ?? 0) ===
                                              optionIdx
                                                ? "bg-orange-500 text-orange-700 border-orange-500 shadow"
                                                : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                                            }
                                          `}
                                        >
                                          Option {optionIdx + 1}
                                        </TabsTrigger>
                                      )
                                    )}
                                  </TabsList>
                                  {meal.mealOptions.map(
                                    (option: any, optionIdx: number) => (
                                      <TabsContent
                                        key={optionIdx}
                                        value={String(optionIdx)}
                                      >
                                        {option.items &&
                                        option.items.length > 0 ? (
                                          <div className="overflow-x-auto w-full">
                                            <ul className="mb-2 flex flex-col gap-2 min-w-[320px] sm:min-w-[400px] md:min-w-[480px]">
                                              {option.items.map(
                                                (item: any, itemIdx: number) => (
                                                  <li
                                                    key={itemIdx}
                                                    className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-2 shadow-sm"
                                                  >
                                                    <div className="flex flex-col">
                                                      <span className="font-medium text-orange-900">
                                                        {item.name}
                                                      </span>
                                                      {item.qty && (
                                                        <span className="text-xs text-gray-500">
                                                          Qty: {item.qty}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="flex gap-3 text-xs text-gray-700">
                                                      <span>
                                                        P: {item.protein}
                                                      </span>
                                                      <span>C: {item.carbs}</span>
                                                      <span>F: {item.fats}</span>
                                                      <span>
                                                        Fi: {item.fibers}
                                                      </span>
                                                      <span>
                                                        Cal: {item.calories}
                                                      </span>
                                                    </div>
                                                  </li>
                                                )
                                              )}
                                            </ul>
                                          </div>
                                        ) : (
                                          <div>
                                            No items found for this option.
                                          </div>
                                        )}
                                        <div className="text-right text-sm font-semibold text-orange-700">
                                          Total Calories:{" "}
                                          {option.items.reduce(
                                            (sum: number, i: any) =>
                                              sum + (i.calories || 0),
                                            0
                                          )}
                                        </div>
                                      </TabsContent>
                                    )
                                  )}
                                </Tabs>
                              </div>
                            ) : null}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No Diet Plan Found
                  </div>
                )}
              </div>
            </div>
          </section>
          {/* Chat/Edit Section */}
          <section className="w-full md:w-[420px] max-w-full flex flex-col min-h-0">
            <div className="flex flex-col h-full min-h-0 bg-white/70 backdrop-blur-lg border border-gray-200 rounded-3xl shadow-xl glassmorphic-card overflow-hidden">
              <div className="px-8 pt-8 pb-4">
                <h3 className="text-lg font-bold text-orange-700 text-center tracking-tight">
                  {editMode ? "Edit Selected Meal" : "Ask About Your Diet Plan"}
                </h3>
              </div>
              {/* Chat messages area */}
              <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-4 flex flex-col-reverse">
                {chatResponse && !editMode ? (
                  <div className="bg-orange-50/80 text-sm border-0 shadow-none rounded-xl p-4 text-orange-900 mb-2">
                    <Markdown>{answer}</Markdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center text-orange-700/80">
                    <Send size={48} className="mb-3 text-orange-300" />
                    <div className="text-lg font-semibold mb-1">
                      Ask anything about your diet plan!
                    </div>
                    <div className="text-sm text-orange-600">
                      You can ask queries regarding your diet plan, get recipes
                      for your meals, or seek general advice and suggestions.
                    </div>
                  </div>
                )}
              </div>
              {/* Input area fixed at bottom */}
              <div className="border-t border-orange-100 bg-white/80 px-8 py-4">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleChat)}
                    className="flex gap-2"
                  >
                    <FormField
                      control={form.control}
                      name="chatQuery"
                      rules={{ required: "Please enter your question" }}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="relative w-full">
                            <FormControl>
                              <textarea
                                rows={2}
                                placeholder={
                                  editMode
                                    ? selectedMealIdx !== null
                                      ? "Describe the changes you want in this meal..."
                                      : "Select a meal to edit"
                                    : "Type your message here..."
                                }
                                disabled={
                                  chatLoading ||
                                  (editMode && selectedMealIdx === null) ||
                                  updating
                                }
                                className="w-full pr-16 rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-300 bg-white/80 p-3 resize-none text-base transition-all min-h-[44px] max-h-[120px]"
                                style={{ minHeight: 44, maxHeight: 120 }}
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="submit"
                              disabled={
                                chatLoading ||
                                updating ||
                                !form.watch("chatQuery").trim() ||
                                (editMode && selectedMealIdx === null)
                              }
                              className="absolute top-1/2 right-2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 text-base font-semibold flex items-center justify-center gap-2 shadow transition"
                            >
                              {updating ? (
                                "..."
                              ) : chatLoading ? (
                                editMode ? (
                                  "..."
                                ) : (
                                  "..."
                                )
                              ) : editMode ? (
                                <>
                                  <Send size={18} className="mr-1" />
                                </>
                              ) : (
                                <>
                                  <Send size={18} className="mr-1" />
                                </>
                              )}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default withAuth(ViewDietPlanPage);
