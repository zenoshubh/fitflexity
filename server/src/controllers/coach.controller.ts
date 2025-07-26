import { appGraph } from "@/utils/agents/coach";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { HumanMessage } from "@langchain/core/messages";
import type { StreamMode } from "@langchain/langgraph";

const chatCoach = asyncHandler(async (req, res) => {
    const input = req.body.message;
    if (!input) {
        throw new ApiError(400, "Message input is required");
    }
    const inputMessage = new HumanMessage(input);
    let responseMessages: any[] = [];
    let fullMessages: any[] = []; // <-- collect all messages here
    let summary: string | null = null;
    const config = {
        configurable: { thread_id: "user" },
        streamMode: "updates" as StreamMode,
    };
    for await (const event of await appGraph.stream(
        { messages: [inputMessage] },
        config
    )) {
        Object.keys(event).forEach((key) => {
            const value = event[key];
            if ("messages" in value && Array.isArray(value.messages)) {
                fullMessages = value.messages; // <-- always keep latest memory
                value.messages.forEach((msg: any) => {
                    const type = msg._getType();
                    if ((type === "human" || type === "ai") && typeof msg.content === "string") {
                        responseMessages.push({
                            type,
                            content: msg.content,
                        });
                    }
                });
            }
            if ("summary" in value && value.summary) {
                summary = value.summary;
            }
        });
    }
    return res.status(200).json(
        new ApiResponse(200, { responses: responseMessages, memory: fullMessages, summary }, "Chat response generated successfully")
    );
});

export { chatCoach };