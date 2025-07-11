import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY!,
    model: "gemini-2.0-flash",
});

// Keep the existing callGenAI function for backward compatibility
export const callGenAI = async (prompt: string) => {
    const response = await llm.invoke(prompt);
    return response.content;
};