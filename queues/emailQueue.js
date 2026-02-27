import dotenv from "dotenv";
dotenv.config({ path: "config.env" });

import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

const redisConnection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    tls: { rejectUnauthorized: false },
});

redisConnection.on("error", (err) => {
    console.error("BullMQ Redis Connection Error:", err);
});

const emailQueue = new Queue("emailQueue", {
    connection: redisConnection,
});

const emailWorker = new Worker(
    "emailQueue",
    async (job) => {
        console.log(
            `\n[Worker] Starting work... Sending email to manager about task: "${job.data.taskTitle}"`,
        );

        await new Promise((resolve) => setTimeout(resolve, 3000));

        console.log(
            `[Worker] Email sent successfully to manager ID: ${job.data.managerId}\n`,
        );
    },
    {
        connection: redisConnection,
    },
);

export { emailQueue };
