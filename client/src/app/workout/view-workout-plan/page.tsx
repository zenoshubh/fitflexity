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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Markdown from "react-markdown";
import { toast } from "sonner";

const HEADER_HEIGHT = 76;
const FOOTER_HEIGHT = 56;

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

const ViewWorkoutPlanPage = () => {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutSession[] | null>(null);
  const [chatResponse, setChatResponse] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string>("");
  const [editMode, setEditMode] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectedSessionIdx, setSelectedSessionIdx] = useState<number | null>(
    null
  );

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
    setLoading(true);
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
      setLoading(false);
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
    setLoading(false);
  };

  // Helper for session selection in edit mode
  const handleSessionSelect = (idx: number) => {
    setSelectedSessionIdx(idx === selectedSessionIdx ? null : idx);
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
        className="flex-1 flex flex-col md:flex-row items-start justify-center px-4 py-12 md:py-20 max-w-7xl mx-auto w-full gap-8"
        style={{
          paddingTop: `${HEADER_HEIGHT}px`,
          paddingBottom: `${FOOTER_HEIGHT + 32}px`,
        }}
      >
        {/* Workout Plan Table Section */}
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
                Your Workout Plan
              </h2>
              <label className="flex items-center gap-2 text-sm font-medium text-orange-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editMode}
                  onChange={() => {
                    setEditMode((v) => !v);
                    setSelectedSessionIdx(null);
                  }}
                  className="accent-orange-500 w-4 h-4"
                />
                Edit Workout Plan Mode
              </label>
            </div>
            {workoutPlan && Array.isArray(workoutPlan) ? (
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
                    minWidth: 600,
                  }}
                >
                  <TableHeader>
                    <TableRow className="bg-orange-500 text-white">
                      {editMode && (
                        <TableHead className="border px-1 py-1"></TableHead>
                      )}
                      <TableHead className="border px-1 py-1">Day</TableHead>
                      <TableHead className="border px-1 py-1">
                        Exercise
                      </TableHead>
                      <TableHead className="border px-1 py-1">Sets</TableHead>
                      <TableHead className="border px-1 py-1">Reps</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workoutPlan.map((session, sessionIdx) =>
                      session.exercises.map((exercise, exIdx) => (
                        <TableRow
                          key={`${session.day}-${exercise.name}-${exIdx}`}
                          className={
                            editMode && selectedSessionIdx === sessionIdx
                              ? "bg-orange-50"
                              : ""
                          }
                        >
                          {/* Edit mode: select session (only on first row of the session) */}
                          {editMode && exIdx === 0 && (
                            <TableCell
                              className="border px-2 py-1 text-center align-middle"
                              rowSpan={session.exercises.length}
                            >
                              <input
                                type="checkbox"
                                checked={selectedSessionIdx === sessionIdx}
                                onChange={() => handleSessionSelect(sessionIdx)}
                                className="accent-orange-500 w-5 h-5"
                                disabled={updating}
                              />
                            </TableCell>
                          )}
                          {editMode && exIdx !== 0 && null}
                          {/* Day (only on first row of the session) */}
                          {exIdx === 0 && (
                            <TableCell
                              className="border px-2 py-1 text-center font-semibold"
                              rowSpan={session.exercises.length}
                            >
                              {session.day}
                            </TableCell>
                          )}
                          {exIdx !== 0 && null}
                          {/* Exercise details */}
                          <TableCell className="border px-2 py-1 break-words whitespace-pre-line max-w-[120px]">
                            {exercise.name}
                          </TableCell>
                          <TableCell className="border px-2 py-1 text-center">
                            {exercise.sets}
                          </TableCell>
                          <TableCell className="border px-2 py-1 text-center">
                            {exercise.reps}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
              {editMode
                ? "Edit Selected Workout Day"
                : "Ask About Your Workout Plan"}
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
                              ? selectedSessionIdx !== null
                                ? "Describe the changes you want in this workout day..."
                                : "Select a workout day to edit"
                              : "Ask about your workout plan..."
                          }
                          disabled={
                            loading ||
                            (editMode && selectedSessionIdx === null) ||
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
                    (editMode && selectedSessionIdx === null)
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
                    ? "Update Workout"
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
      {/* Add <Footer /> if needed */}
    </div>
  );
};

export default ViewWorkoutPlanPage;
