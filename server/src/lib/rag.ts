import { MistralAIEmbeddings } from "@langchain/mistralai";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { QdrantVectorStore } from "@langchain/qdrant";


const embeddings = new MistralAIEmbeddings({
    apiKey: process.env.MISTRAL_API_KEY!,
    model: "mistral-embed",
});

let vectorStore: any = null;
let vectorDbType: "pinecone" | "qdrant" = "pinecone";

if (process.env.NODE_ENV === "development") {
    vectorDbType = "qdrant";
    vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL,
        collectionName: "diet-plans",     
    });
} else {
    vectorDbType = "pinecone";
    vectorStore = new PineconeClient({
        apiKey: process.env.PINECONE_API_KEY!,
    });
}

export { embeddings, vectorStore, vectorDbType };