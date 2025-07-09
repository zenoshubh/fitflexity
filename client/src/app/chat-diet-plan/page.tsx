"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import withAuth from "@/components/withAuth";
import { toast } from "sonner";
import Markdown from "react-markdown";
// shadcn/ui components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

type ChatFormValues = {
  chatQuery: string;
};

const ChatDietPlan = () => {
  const [response, setResponse] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string>("");

  const form = useForm<ChatFormValues>({
    defaultValues: {
      chatQuery: "",
    },
  });

  const handleChat = async (values: ChatFormValues) => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await api.post("/diet/chat-diet-plan", {
        question: values.chatQuery,
      });

      const { status, data, message } = res.data;
      if (status == 200) {
        setResponse(data || "No relevant information found.");
        setAnswer(data.answer);
        toast.success(message || "Response received successfully.");
      }
    } catch (err: any) {
      setResponse("Something went wrong.");
      toast.error(err.response?.data?.message || "Something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
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
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Ask about your diet plan..."
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={loading || !form.watch("chatQuery").trim()}
          >
            {loading ? "Asking..." : "Ask"}
          </Button>
        </form>
      </Form>
      {response && (
        <Card className="mt-6">
          <CardContent className="p-4 bg-gray-50 whitespace-pre-line">
            <Markdown>{answer}</Markdown>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default withAuth(ChatDietPlan);
