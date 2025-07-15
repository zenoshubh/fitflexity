import { Queue } from "bullmq";

const queue = new Queue("embed-diet-plan", {
  connection: { 
    host: process.env.VALKEY_HOST || "localhost", 
    port: process.env.VALKEY_PORT ? parseInt(process.env.VALKEY_PORT) : 6379
  },
});

export { queue };

