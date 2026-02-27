import redisClient from "../config/redisClient.js";

export const clearKey = async (key) => {
    try {
        await redisClient.del(key);
        console.log(`[Cache] Cleared specific key: ${key}`);
    } catch (error) {
        console.error("Redis Clear Cache Error:", error);
    }
};
