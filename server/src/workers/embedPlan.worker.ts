import "dotenv/config";
import { Worker } from "bullmq";
import { embeddings } from "@/lib/rag";
import { PineconeStore } from "@langchain/pinecone";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { initialiseVectorStore } from "@/lib/vectorStore";

new Worker(
  "embed-plan",
  async job => {
    try {
      const { planJson, userId, goal, planType } = job.data;

      const doc = new Document({
        pageContent: JSON.stringify(planJson),
        metadata: {
          userId,
          type: planType,
          createdAt: new Date().toISOString(),
          goal,
        }
      });
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const splits = await splitter.splitDocuments([doc]);

      const vectorStore = await initialiseVectorStore({
        collectionName: `${planType}-plans`
      });

      await vectorStore.addDocuments(splits);
      console.log(`${planType} plan embedded in vector store for user: ${userId}`);

    } catch (err) {
      console.error("Embedding job failed:", err);
    }
  },
  {
    connection: {
      host: process.env.VALKEY_HOST || "localhost",
      port: process.env.VALKEY_PORT ? parseInt(process.env.VALKEY_PORT) : 6379,
    }
  }
);