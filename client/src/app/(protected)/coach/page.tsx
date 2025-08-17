"use client";
import React, { useState, useRef, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import Markdown from "react-markdown";

type Message = {
  type: string;
  content: string;
  role: "user" | "coach";
};

function getSessionId() {
  // Remove previous sessionId on every reload
  sessionStorage.removeItem("sessionId");
  const sessionId = crypto.randomUUID();
  sessionStorage.setItem("sessionId", sessionId);
  return sessionId;
}

const sessionId = getSessionId();

const CoachChatPage = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    const userMsg: Message = {
      type: "user",
      content: input,
      role: "user",
    };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const response = await api.post("/coach/chat", {
        message: input,
        sessionId: sessionId, // Pass sessionId in request body
      });
      const { data } = response.data;
      // Update: Expect a single response object, not array
      const coachMsg: Message | null = data.response
        ? { ...data.response, role: "coach" }
        : null;
      if (coachMsg) setMessages((prev) => [...prev, coachMsg]);
      setSummary(data.summary || null);
      setInput("");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSend();
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-[#F7F7F9]">
      <div className="px-8 pt-8 pb-4 border-b border-orange-100 w-full">
        <h2 className="text-2xl font-extrabold text-orange-700 text-center tracking-tight">
          Coach Chat
        </h2>
        <p className="text-center text-orange-600 text-sm mt-1">
          Get concise fitness advice from your AI coach.
        </p>
      </div>
      {/* Chat messages area */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-4 flex flex-col gap-2 w-full"
        style={{ background: "#fff" }}
      >
        {messages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-center text-orange-700/80">
            <Send size={48} className="mb-3 text-orange-300" />
            <div className="text-lg font-semibold mb-1">
              Start a conversation with your coach!
            </div>
            <div className="text-sm text-orange-600">
              Ask for workout tips, nutrition advice, or anything fitness
              related.
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex w-full mb-1 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm text-base whitespace-pre-line break-words
                          ${
                            msg.role === "user"
                              ? "bg-gray-100 text-gray-900"
                              : "bg-orange-50 text-orange-900 border border-orange-100"
                          }
                        `}
                  style={{
                    borderTopRightRadius: msg.role === "user" ? 0 : undefined,
                    borderTopLeftRadius: msg.role === "coach" ? 0 : undefined,
                  }}
                >
                  <Markdown>{msg.content}</Markdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start w-full">
                <div className="max-w-[80%] px-4 py-2 rounded-2xl bg-orange-50 text-orange-900 border border-orange-100 shadow-sm animate-pulse">
                  ...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      {/* Input area fixed at bottom */}
      <div className="border-t border-orange-100 bg-white/80 px-8 py-4 w-full sticky bottom-0 z-10">
        <div className="relative w-full flex items-center">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1 w-full rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-300 bg-white/80 p-3 resize-none text-base transition-all min-h-[44px] max-h-[120px] pr-16"
            style={{ minHeight: 44, maxHeight: 120 }}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center h-full">
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2 text-base font-semibold flex items-center justify-center gap-2 shadow transition"
              style={{ minHeight: 36 }}
            >
              {loading ? "..." : <Send size={18} className="mr-1" />}
            </Button>
          </div>
        </div>
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </div>
    </div>
  );
};

export default CoachChatPage;
