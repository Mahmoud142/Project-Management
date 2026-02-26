import { Queue, Worker } from "bullmq";

// 1. Define the queue (connecting it to Redis running on Docker)
const emailQueue = new Queue("emailQueue", {
    connection: {
        host: "127.0.0.1",
        port: 6379,
    },
});

// 2. The Worker that pulls jobs from the queue and executes them in the background
const emailWorker = new Worker(
    "emailQueue",
    async (job) => {
        // The code here doesn't block the main server at all
        console.log(
            `\n[Worker] ⏳ Starting work... Sending email to manager about task: "${job.data.taskTitle}"`,
        );

        // Simulate sending an actual email that takes 3 seconds
        await new Promise((resolve) => setTimeout(resolve, 3000));

        console.log(
            `[Worker] ✅ Email sent successfully to manager ID: ${job.data.managerId}\n`,
        );
    },
    {
        connection: {
            host: "127.0.0.1",
            port: 6379,
        },
    },
);

export { emailQueue };
