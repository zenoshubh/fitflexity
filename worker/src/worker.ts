import { Worker } from "bullmq";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { initialiseVectorStore } from "./lib/vectorStore";

new Worker(
  "manage-plan-embeddings",
  async job => {
    if (job.name === "embed-diet-plan" || job.name === "embed-workout-plan") {
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
    }

    if (job.name === "delete-workout-plan" || job.name === "delete-diet-plan") {
      try {
        const { userId, planType } = job.data;

        const vectorStore = await initialiseVectorStore({
          collectionName: `${planType}-plans`
        });

        const filter = {
          must: [
            {
              key: "metadata.userId",
              match: { value: userId }
            }
          ]
        };

        await vectorStore.delete({ filter });

        console.log(`${planType} plan deleted from vector store for user: ${userId}`);

      } catch (err) {
        console.error("Deletion job failed:", err);
      }
    }
  },
  {
    connection: {
      host: process.env.VALKEY_HOST,
      port: process.env.VALKEY_PORT ? parseInt(process.env.VALKEY_PORT) : 6379,
    }
  }
).on("completed", job => {
  console.log(`Job completed: ${job.id} - ${job.name}`);
}).on("failed", (job, err) => {
  console.error(`Job with ID ${job?.id} and name ${job?.name} failed: ${err.message}`);
});
