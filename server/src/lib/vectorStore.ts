import { QdrantVectorStore } from "@langchain/qdrant";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { embeddings } from "./rag";
import { PineconeStore } from "@langchain/pinecone";


const initialiseVectorStore = async ({ collectionName }: { collectionName: string }) => {
    let vectorStore: any = null;
    if (process.env.VECTOR_DB_TYPE === "qdrant") {
        vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
            url: process.env.QDRANT_URL,
            collectionName: collectionName,
        });
    } else {

        const pineconeClient = new PineconeClient({
            apiKey: process.env.PINECONE_API_KEY!,
        });

        const indexName = collectionName;
        const indexes = await pineconeClient.listIndexes();
        const indexExists = indexes.indexes?.some((idx: { name: string }) => idx.name === indexName);

        if (!indexExists) {
            await pineconeClient.createIndex({
                name: indexName,
                dimension: 1024,
                metric: "cosine",
                spec: {
                    serverless: {
                        cloud: "aws",
                        region: "us-east-1"
                    }
                }
            });
            // Wait for index to be ready
            let isReady = false, attempts = 0, maxAttempts = 10;
            while (!isReady && attempts < maxAttempts) {
                try {
                    await pineconeClient.Index(indexName).describeIndexStats();
                    isReady = true;
                } catch {
                    attempts++;
                    await new Promise(res => setTimeout(res, 1000));
                }
            }
            if (!isReady) return;
        }

        const index = pineconeClient.Index(indexName);
        vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: index,
            textKey: "text",
            namespace: `${collectionName}`,
        });
    }
    return vectorStore;
}

export { initialiseVectorStore };