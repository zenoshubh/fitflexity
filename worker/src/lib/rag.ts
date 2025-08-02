import { MistralAIEmbeddings } from "@langchain/mistralai";

const embeddings = new MistralAIEmbeddings({
    apiKey: process.env.MISTRAL_API_KEY!,
    model: "mistral-embed",
});

export { embeddings };