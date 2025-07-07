import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY!,
    model: "gemini-2.0-flash",
    temperature: 0
});

export const callGenAI = async (prompt: string) => {

    try {
        const response = await llm.invoke(prompt);
        return response?.content;
    } catch (error) {
        console.error("Error calling Google Generative AI:", error);
        throw new Error("Failed to generate response from LLM");
    }
}