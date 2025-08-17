import {
    SystemMessage,
    HumanMessage,
    RemoveMessage,
    AIMessage,
    ToolMessage,
} from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import {
    MessagesAnnotation,
    StateGraph,
    START,
    END,
    Annotation,
    type StreamMode,
} from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { initialiseVectorStore } from "@/lib/vectorStore";
import { ToolNode } from "@langchain/langgraph/prebuilt";

const memory = new MemorySaver();

const GraphAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    summary: Annotation<string>({
        reducer: (_, action) => action,
        default: () => "",
    }),
    // User details ke liye naya field add kiya hai
    userDetails: Annotation<string>({
        reducer: (_, action) => action, // Isse yeh value state mein rahegi
        default: () => "",
    }),
});

const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const dietPlanRetriever = tool(
    async ({ query }) => {
        console.log("Diet Retriever called with query:", query);

        const vectorStore = await initialiseVectorStore({ collectionName: "diet-plans" });
        const results = await vectorStore.similaritySearch(query, 2);
        if (results.length === 0) {
            return "No relevant diet plans found.";
        }
        const similarContent = results.map((result: any) => result.pageContent).join("\n\n");
        const PROMPT = `You are a fitness coach. Based on the following diet plans, provide a concise response to the query: "${query}"\n\nDiet Plans:\n${similarContent}`;
        const response = await model.invoke(PROMPT);

        return response.content || "No relevant information found.";
    },
    {
        name: "dietPlanRetriever",
        description: "Answer the queries related to diet plan and its meals",
        schema: z.object({
            query: z.string().describe("The query to be answered using diet plans"),
        }),
    }
);

const workoutPlanRetriever = tool(
    async ({ query }) => {
        const vectorStore = await initialiseVectorStore({ collectionName: "workout-plans" });
        const results = await vectorStore.similaritySearch(query, 2);
        if (results.length === 0) {
            return "No relevant workout plans found.";
        }

        const similarContent = results.map((result: any) => result.pageContent).join("\n\n");
        const PROMPT = `You are a fitness coach. Based on the following workout plans, provide a concise response to the query: "${query}"\n\nWorkout Plans:\n${similarContent}`;
        const response = await model.invoke(PROMPT);

        return response.content || "No relevant information found.";
    },
    {
        name: "workoutPlanRetriever",
        description: "Answer the queries related to workout plans",
        schema: z.object({
            query: z.string().describe("The query to be answered using workout plans"),
        }),
    }
);

const tools = [dietPlanRetriever, workoutPlanRetriever];
const llmWithTools = model.bindTools(tools);

const toolNode = new ToolNode(tools);

async function callModel(state: typeof GraphAnnotation.State): Promise<Partial<typeof GraphAnnotation.State>> {
    console.log("Calling 'conversation' node (callModel)");

    const { summary, userDetails } = state;
    let { messages } = state;

    // Get recent ToolMessages
    let recentToolMessages: ToolMessage[] = [];
    for (let i = state["messages"].length - 1; i >= 0; i--) {
        let message = state["messages"][i];
        if (message instanceof ToolMessage) {
            recentToolMessages.push(message);
        } else {
            break;
        }
    }
    let toolMessages = recentToolMessages.reverse();

    // Format tool messages content
    const docsContent = toolMessages.map((doc) => doc.content).join("\n");

    const SYSTEM_PROMPT = `You are a highly experienced, evidence-based fitness coach. 
Your goal is to deliver accurate, practical, and truly personalized advice based on the client's details below. 
Always be encouraging, friendly, and supportive in your tone. 
Focus on actionable recommendations that consider the client's goals, lifestyle, preferences, and health status. 
Avoid exaggeration, unnecessary details, and jargon. 
Keep responses concise, clear, and easy to understand. 
If you need more information (such as personal details, goals, or limitations), politely ask the user to share it, and reassure them that it's okay if they haven't mentioned it yet. 
You can answer any questions related to nutrition (including recipes, meal planning, and nutrition knowledge) or exercise (including form, workouts, training strategies, and recovery). 
If the question is not related to workout or nutrition, gently let the user know and encourage them to ask relevant questions. 
Make sure your response feels natural, empathetic, and human—never robotic. 
Always respond with plain text only—no JSON, Markdown, HTML, or backticks. 
Limit your answer to less than 150 words unless the user requests more detail. 
Structure your advice in clear, numbered or bulleted points, stepwise, and always to the point. 
If safety or health concerns arise, mention them briefly and encourage consulting a professional if needed.


    Client details: ${userDetails}`;


    // Prepare system message with summary if available
    let systemMessage: SystemMessage;
    if (summary) {
        systemMessage = new SystemMessage({
            id: uuidv4(),
            content: `${SYSTEM_PROMPT} \n\nYou have a summary of the conversation so far. Use it to provide context for your response. \n\nSummary: ${summary}`,
        });
    } else {
        systemMessage = new SystemMessage({
            id: uuidv4(),
            content:
                SYSTEM_PROMPT,
        });
    }

    // Build final messages array
    let finalMessages = [systemMessage];

    // If there are tool messages, add their content as a HumanMessage for context
    if (docsContent.trim().length > 0) {
        finalMessages.push(
            new HumanMessage({
                id: uuidv4(),
                content: `Relevant info from tools:\n${docsContent}`,
            })
        );
    }

    const conversationMessages = state.messages.filter(
        (message) =>
            message instanceof HumanMessage ||
            message instanceof SystemMessage ||
            (message instanceof AIMessage && message.tool_calls && message.tool_calls.length == 0)
    );

    // Add the rest of the conversation messages
    finalMessages = [...finalMessages, ...conversationMessages];

    // Invoke the model
    const response = await llmWithTools.invoke(finalMessages);
    return { messages: [response], userDetails: userDetails };
}

function conversationCondition(state: typeof GraphAnnotation.State): "tools" | "summarize_conversation" | typeof END {
    const messages = state.messages;
    const lastMessage = messages.at(-1);

    console.log("Checking condition - messages length:", messages.length);
    console.log("Last message type:", lastMessage?.constructor.name);

    // Tool call check - if the last message has tool calls
    if (
        lastMessage &&
        "tool_calls" in lastMessage &&
        Array.isArray((lastMessage as any).tool_calls) &&
        (lastMessage as any).tool_calls.length > 0
    ) {
        console.log("Going to tools");
        return "tools";
    }

    // Count only user messages for summarization trigger
    const userMessageCount = messages.filter(msg => msg.constructor.name === "HumanMessage").length;
    console.log("User message count:", userMessageCount);

    // Summarize after every 3 user messages instead of total message count
    if (userMessageCount >= 3) {
        console.log("Going to summarize");
        return "summarize_conversation";
    }

    console.log("Going to END");
    return END;
}

async function summarizeConversation(state: typeof GraphAnnotation.State): Promise<Partial<typeof GraphAnnotation.State>> {
    console.log("Summarizing conversation (summarizeConversation)");
    const { summary, messages } = state;
    let summaryMessage;

    if (summary) {
        summaryMessage =
            `This is summary of the conversation to date: ${summary}\n\n` +
            "Extend the summary by taking into account the new messages above. Respond with plain text only:";
    } else {
        summaryMessage = "Create a summary of the conversation above. Respond with plain text only:";
    }

    const allMessages = [
        ...messages,
        new HumanMessage({
            id: uuidv4(),
            content: summaryMessage,
        }),
    ];

    const response = await model.invoke(allMessages);

    // Keep the last 2 messages (recent context) and remove older ones
    const deleteMessages = messages
        .slice(0, -2)
        .filter((m) => typeof m.id === "string")
        .map((m) => new RemoveMessage({ id: m.id as string }));

    if (typeof response.content !== "string") {
        throw new Error("Expected a string response from the model");
    }

    return { summary: response.content, messages: deleteMessages };
}

const workflow = new StateGraph(GraphAnnotation)

    .addNode("conversation", callModel)
    .addNode("tools", toolNode)
    .addNode("summarize_conversation", summarizeConversation)
    .addEdge("__start__", "conversation")
    .addConditionalEdges("conversation", conversationCondition, {
        tools: "tools", // Fixed: changed from "Action" to "tools"
        summarize_conversation: "summarize_conversation",
        __end__: "__end__",
    })
    .addEdge("tools", "conversation")
    .addEdge("summarize_conversation", "__end__");

export const appGraph = workflow.compile({ checkpointer: memory });