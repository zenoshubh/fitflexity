import { Queue } from "bullmq";

const managePlanEmbeddingsQueue = new Queue("manage-plan-embeddings", {
  connection: { 
    host: process.env.VALKEY_HOST, 
    port: process.env.VALKEY_PORT ? parseInt(process.env.VALKEY_PORT) : 6379
  },
});

export { managePlanEmbeddingsQueue };

