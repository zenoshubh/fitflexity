import { appGraph } from "@/utils/agents/coach";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { HumanMessage } from "@langchain/core/messages";
import { userInfo } from "os";
import { z } from "zod";

// Request validation schema
const chatRequestSchema = z.object({
  message: z.string(),
  sessionId: z.string().uuid(),
});

const chatCoach = asyncHandler(async (req, res) => {
  
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Unauthorized access");
  }

  const userDetails = `First Name: ${user.firstName}, Age: ${user.dateOfBirth ? new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear() : "N/A"}, Gender: ${user.gender} , Weight: ${user.currentWeightInKgs} kg, Height: ${user.heightInCms} cm, Goal: ${user.goal}, Activity Level: ${user.activityLevel}`;

  const parsedData = chatRequestSchema.safeParse(req.body);

  if (!parsedData.success) {
    throw new ApiError(400, "Invalid message or sessionId format");
  }

  const { message, sessionId } = parsedData.data;
  const inputMessage = new HumanMessage(message);

  const config = {
    configurable: { thread_id: sessionId },
  };

  const result = await appGraph.invoke(
    { messages: [inputMessage] , userDetails: userDetails },
    config
  );

  console.log("Chat response from appGraph:", result);

  // Find the first AI message
  let aiResponse = null;
  if (Array.isArray(result.messages)) {
    const aiMsg = result.messages.findLast((msg: any) => msg._getType?.() === "ai" && typeof msg.content === "string");
    if (aiMsg) {
      aiResponse = {
        type: "ai",
        content: aiMsg.content,
      };
    }
  }

  console.log("AI Chat response:", aiResponse);

  return res.status(200).json(
    new ApiResponse(200, { response: aiResponse }, "Chat response generated successfully")
  );
});

export { chatCoach };