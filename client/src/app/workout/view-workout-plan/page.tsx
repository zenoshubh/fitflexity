"use client";

import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { Edit3, Send, Dumbbell } from "lucide-react";

type ChatFormValues = {
  chatQuery: string;
};

type Exercise = {
  name: string;
  sets: number;
  reps: number;
};

type WorkoutSession = {
  day: string;
  exercises: Exercise[];
};

const HEADER_HEIGHT = 76;
const FOOTER_HEIGHT = 56;

const ViewWorkoutPlanPage = () => {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutSession[] | null>(null);
  const [chatResponse, setChatResponse] = useState<any | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [answer, setAnswer] = useState<string>("");
  const [editMode, setEditMode] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedSessionIdx, setSelectedSessionIdx] = useState<number | null>(
    null
  );
  const [selectedTab, setSelectedTab] = useState<string>("0");

  const form = useForm<ChatFormValues>({
    defaultValues: {
      chatQuery: "",
    },
  });

  const fetchWorkoutPlan = async () => {
    try {
      const response = await api.get("/workout/get-workout-plan");
      const { status, data, message } = response.data;
      if (status === 200) {
        setWorkoutPlan(data.plan);
      } else {
        toast.error(message);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to fetch workout plan"
      );
    }
  };

  useEffect(() => {
    fetchWorkoutPlan();
  }, []);

  // Chat handler (normal and edit mode)
  const handleChat = async (values: ChatFormValues) => {
    setChatLoading(true);
    setChatResponse(null);

    if (
      editMode &&
      selectedSessionIdx !== null &&
      workoutPlan &&
      Array.isArray(workoutPlan)
    ) {
      // Edit mode: update workout session (day)
      setUpdating(true);
      try {
        const selectedSession = workoutPlan[selectedSessionIdx];
        // Call API with the selected session as 'workout'
        const res = await api.put("/workout/update-workout-plan", {
          workout: selectedSession,
          updateInstruction: values.chatQuery,
        });
        const { status, data, message } = res.data;
        if (status === 200 && data && data.plan) {
          setWorkoutPlan(data.plan);
          toast.success(message || "Workout updated successfully.");
          setSelectedSessionIdx(null);
          form.reset();
        } else {
          toast.error(message || "Failed to update workout.");
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
      const res = await api.post("/workout/chat-workout-plan", {
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
    setChatLoading(false);
  };

  // Helper for session selection in edit mode
  const handleSessionSelect = (idx: number) => {
    setSelectedSessionIdx(idx === selectedSessionIdx ? null : idx);
    form.setValue("chatQuery", "");
    setChatResponse(null);
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
      <main
        className="flex-1 w-full pt-6 pb-6 md:pt-12 md:pb-12"
      >
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 max-w-7xl mx-auto px-1 sm:px-2 md:px-8 h-auto md:h-[calc(100vh-96px)]">
          {/* Workout Plan Section */}
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
                  Your Workout Plan
                </h2>
                <button
                  className={`flex items-center gap-2 text-sm font-medium text-orange-700 px-3 py-1 rounded-full transition
                    ${editMode ? "bg-orange-100 shadow" : "hover:bg-orange-50"}
                  `}
                  onClick={() => {
                    setEditMode((v) => !v);
                    setSelectedSessionIdx(null);
                  }}
                  type="button"
                >
                  <Edit3
                    className={`transition ${
                      editMode ? "text-orange-500" : "text-orange-300"
                    }`}
                    size={20}
                  />
                  <span className="hidden md:inline">Edit Workout Plan</span>
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-0 md:pr-2">
                {workoutPlan && Array.isArray(workoutPlan) && workoutPlan.length > 0 ? (
                  <Tabs
                    value={selectedTab}
                    onValueChange={setSelectedTab}
                    className="w-full"
                  >
                    <TabsList className="mb-4 flex gap-2 bg-orange-50 rounded-full p-1 overflow-x-auto scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent">
                      {workoutPlan.map((session, idx) => (
                        <TabsTrigger
                          key={session.day}
                          value={String(idx)}
                          className={`px-3 sm:px-4 py-1 rounded-full border text-xs font-semibold transition whitespace-nowrap
                            ${
                              selectedTab === String(idx)
                                ? "bg-orange-500 text-white border-orange-500 shadow"
                                : "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                            }
                          `}
                        >
                          {session.day}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {workoutPlan.map((session, idx) => (
                      <TabsContent
                        key={session.day}
                        value={String(idx)}
                        className="focus:outline-none"
                      >
                        <div className="flex flex-col gap-4">
                          {/* Edit mode select button */}
                          {editMode && (
                            <div className="mb-2 flex">
                              <button
                                type="button"
                                className={`rounded-full p-1 border-2 transition
                                  ${selectedSessionIdx === idx
                                    ? "border-orange-500 bg-orange-100"
                                    : "border-orange-200 bg-white"}
                                `}
                                onClick={() => handleSessionSelect(idx)}
                                disabled={updating}
                                aria-label="Select workout day to edit"
                              >
                                <Edit3
                                  size={18}
                                  className={`transition cursor-pointer ${
                                    selectedSessionIdx === idx
                                      ? "text-orange-500"
                                      : "text-orange-300"
                                  }`}
                                />
                              </button>
                              <span className="ml-2 text-sm text-orange-700 font-medium self-center">
                                {selectedSessionIdx === idx
                                  ? "Selected for edit"
                                  : "Edit this day"}
                              </span>
                            </div>
                          )}
                          {/* Responsive Exercises Table */}
                          <div className="overflow-x-auto w-full">
                            <table className="w-full border-separate border-spacing-0 rounded-2xl overflow-hidden bg-orange-50/60 shadow-sm text-sm min-w-[340px] sm:min-w-[420px] md:min-w-[520px]">
                              <thead>
                                <tr className="bg-orange-100 text-orange-700">
                                  <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-left rounded-tl-2xl">Exercise</th>
                                  <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-center">Sets</th>
                                  <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-center rounded-tr-2xl">Reps</th>
                                </tr>
                              </thead>
                              <tbody>
                                {session.exercises.map((exercise, exIdx) => (
                                  <tr
                                    key={exercise.name + exIdx}
                                    className="even:bg-orange-50 odd:bg-white/80 transition"
                                  >
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-orange-900 whitespace-pre-line break-words rounded-bl-2xl max-w-[120px] sm:max-w-[180px]">
                                      {exercise.name}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-center text-orange-700 font-semibold">
                                      {exercise.sets}
                                    </td>
                                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-center text-orange-700 font-semibold rounded-br-2xl">
                                      {exercise.reps}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No Workout Plan Found
                  </div>
                )}
              </div>
            </div>
          </section>
          {/* Chat/Edit Section */}
          <section className="w-full md:w-[420px] max-w-full flex flex-col min-h-0 mt-4 md:mt-0">
            <div className="flex flex-col h-full min-h-0 bg-white/70 backdrop-blur-lg border border-gray-200 rounded-3xl shadow-xl glassmorphic-card overflow-hidden">
              <div className="px-4 sm:px-8 pt-8 pb-4">
                <h3 className="text-lg font-bold text-orange-700 text-center tracking-tight">
                  {editMode
                    ? "Edit Selected Workout Day"
                    : "Ask About Your Workout Plan"}
                </h3>
              </div>
              {/* Chat messages area */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 pb-4 flex flex-col-reverse">
                {chatResponse && !editMode ? (
                  <div className="bg-orange-50/80 text-sm border-0 shadow-none rounded-xl p-4 text-orange-900 mb-2">
                    <Markdown>{answer}</Markdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center text-orange-700/80">
                    <Dumbbell size={48} className="mb-3 text-orange-300" />
                    <div className="text-lg font-semibold mb-1">
                      Ask anything about your workout plan!
                    </div>
                    <div className="text-sm text-orange-600">
                      You can ask queries regarding your workout plan, get exercise suggestions, or seek general advice and tips.
                    </div>
                  </div>
                )}
              </div>
              {/* Input area fixed at bottom */}
              <div className="border-t border-orange-100 bg-white/80 px-4 sm:px-8 py-4">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleChat)}
                    className="w-full"
                  >
                    <FormField
                      control={form.control}
                      name="chatQuery"
                      rules={{ required: "Please enter your question" }}
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <div className="relative w-full">
                            <FormControl>
                              <textarea
                                rows={2}
                                placeholder={
                                  editMode
                                    ? selectedSessionIdx !== null
                                      ? "Describe the changes you want in this workout day..."
                                      : "Select a workout day to edit"
                                    : "Type your message here..."
                                }
                                disabled={
                                  chatLoading ||
                                  (editMode && selectedSessionIdx === null) ||
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
                                (editMode && selectedSessionIdx === null)
                              }
                              className="absolute top-1/2 right-2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 text-base font-semibold flex items-center justify-center gap-2 shadow transition"
                              tabIndex={-1}
                            >
                              {updating ? (
                                "..."
                              ) : chatLoading ? (
                                editMode ? "..." : "..."
                              ) : editMode ? (
                                <><Send size={18} className="mr-1" /></>
                              ) : (
                                <><Send size={18} className="mr-1" /></>
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
      {/* Add <Footer /> if needed */}
    </div>
  );
};

export default ViewWorkoutPlanPage;

