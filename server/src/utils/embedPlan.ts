import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { initialiseVectorStore } from "@/lib/vectorStore";

export const embedPlan = async ({ planJson, userId, planType }: { planJson: any; userId: string; planType: string; }) => {
    try {

        const doc = new Document({
            pageContent: JSON.stringify(planJson),
            metadata: {
                userId,
                type: planType,
                createdAt: new Date().toISOString(),
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

