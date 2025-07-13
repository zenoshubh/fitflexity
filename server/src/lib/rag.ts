import { MistralAIEmbeddings } from "@langchain/mistralai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";


export const pinecone = new PineconeClient({
    apiKey: process.env.PINECONE_API_KEY!,
});

export const embeddings = new MistralAIEmbeddings({
    apiKey: process.env.MISTRAL_API_KEY!,
    model: "mistral-embed",
});