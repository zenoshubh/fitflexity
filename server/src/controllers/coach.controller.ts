import { appGraph } from "@/utils/agents/coach";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { HumanMessage } from "@langchain/core/messages";
import type { StreamMode } from "@langchain/langgraph";

const chatCoach = asyncHandler(async (req, res) => {

    const user = req.user;

    if (!user || !user.id) {
        throw new ApiError(401, "Unauthorized access");
    }

    const input = req.body.message;
    if (!input) {
        throw new ApiError(400, "Message input is required");
    }
    const inputMessage = new HumanMessage(input);
    let responseMessages: any[] = [];
    const config = {
        configurable: { thread_id: user.id },
        streamMode: "updates" as StreamMode,
    };
    for await (const event of await appGraph.stream(
        { messages: [inputMessage] },
        config
    )) {
        Object.keys(event).forEach((key) => {
            const value = event[key];
            if ("messages" in value && Array.isArray(value.messages)) {
                value.messages.forEach((msg: any) => {
                    // Only include AI and human messages
                    const type = msg._getType();
                    if (type === "human" || type === "ai") {
                        responseMessages.push({
                            type,
                            content: msg.content,
                        });
                    }
                });
            }
        });
    }
    return res.status(200).json(new ApiResponse(200, { responses: responseMessages }, "Chat response generated successfully"));
});

export { chatCoach };