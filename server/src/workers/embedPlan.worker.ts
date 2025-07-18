import "dotenv/config";
import { Worker } from "bullmq";
import { embeddings, vectorStore, vectorDbType } from "@/lib/rag";
import { PineconeStore } from "@langchain/pinecone";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

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

      if (vectorDbType === "qdrant") {
        // Qdrant logic (vectorStore already points to the collection)
        await vectorStore.addDocuments(splits);
        console.log(`${planType} plan embedded in Qdrant for user: ${userId}`);
      } else {
        // Pinecone logic
        const indexName = `${planType}-plans`;
        const indexes = await vectorStore.listIndexes();
        const indexExists = indexes.indexes?.some((idx: { name: string }) => idx.name === indexName);

        if (!indexExists) {
          await vectorStore.createIndex({
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
              await vectorStore.Index(indexName).describeIndexStats();
              isReady = true;
            } catch {
              attempts++;
              await new Promise(res => setTimeout(res, 1000));
            }
          }
          if (!isReady) return;
        }

        const index = vectorStore.Index(indexName);
        const pineconeStore = await PineconeStore.fromExistingIndex(embeddings, {
          pineconeIndex: index,
          textKey: "text",
          namespace: `${planType}-plans`,
        });
        await pineconeStore.addDocuments(splits);
        console.log(`${planType} plan embedded in Pinecone for user: ${userId}`);
      }
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