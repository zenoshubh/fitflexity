import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "./rag";


const initialiseVectorStore = async ({ collectionName }: { collectionName: string }) => {
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL,
        collectionName: collectionName,
    });

    return vectorStore;
}

export { initialiseVectorStore };