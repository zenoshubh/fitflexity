import {
    SystemMessage,
    HumanMessage,
    RemoveMessage,
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

const memory = new MemorySaver();

const GraphAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    summary: Annotation<string>({
        reducer: (_, action) => action,
        default: () => "",
    }),
});

const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

async function callModel(state: typeof GraphAnnotation.State): Promise<Partial<typeof GraphAnnotation.State>> {
    const { summary } = state;
    let { messages } = state;
    // Add instruction for concise responses
    const conciseInstruction = new SystemMessage({
        id: uuidv4(),
        content:
            "Always respond in less than 50 words. You are a fitness coach who gives concise advice.",
    });
    if (summary) {
        const systemMessage = new SystemMessage({
            id: uuidv4(),
            content: `Always respond in less than 50 words. You are a fitness coach who gives concise advice. 
            \nSummary of conversation earlier: ${summary}`,
        });
        messages = [systemMessage, ...messages];
    } else {
        messages = [conciseInstruction, ...messages];
    }
    const response = await model.invoke(messages);
    return { messages: [response] };
}

function shouldContinue(state: typeof GraphAnnotation.State): "summarize_conversation" | typeof END {
    const messages = state.messages;
    if (messages.length > 6) {
        return "summarize_conversation";
    }
    return END;
}

async function summarizeConversation(state: typeof GraphAnnotation.State): Promise<Partial<typeof GraphAnnotation.State>> {
    const { summary, messages } = state;
    let summaryMessage;
    if (summary) {
        summaryMessage =
            `This is summary of the conversation to date: ${summary}\n\n` +
            "Extend the summary by taking into account the new messages above:";
    } else {
        summaryMessage = "Create a summary of the conversation above:";
    }
    const allMessages = [
        ...messages,
        new HumanMessage({
            id: uuidv4(),
            content: summaryMessage,
        }),
    ];
    const response = await model.invoke(allMessages);
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
    .addNode("summarize_conversation", summarizeConversation)
    .addEdge(START, "conversation")
    .addConditionalEdges("conversation", shouldContinue)
    .addEdge("summarize_conversation", END);

export const appGraph = workflow.compile({ checkpointer: memory });
// const config = {
//     configurable: { thread_id: "express" },
//     streamMode: "updates" as StreamMode,
// };

