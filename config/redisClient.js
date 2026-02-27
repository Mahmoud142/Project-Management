import dotenv from "dotenv";
dotenv.config({ path: "config.env" });

import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        tls: true,
        rejectUnauthorized: false,
    },
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

export const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("Redis connected successfully to Cloud!");
    } catch (error) {
        console.error("Failed to connect to Redis:", error);
    }
};

export default redisClient;
