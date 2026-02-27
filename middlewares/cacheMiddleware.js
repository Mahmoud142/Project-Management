import redisClient from "../config/redisClient.js";

export const cacheData = (expiryInSeconds = 300) => {
    return async (req, res, next) => {
        // Use the request URL as the Redis key
        const key = req.originalUrl;

        try {
            const cachedResponse = await redisClient.get(key);

            if (cachedResponse) {
                console.log(`[Cache] HIT - Serving ${key} from Redis`);
                return res.status(200).json(JSON.parse(cachedResponse));
            }

            console.log(`[Cache] MISS - Fetching ${key} from Database`);

            // Intercept res.json to save data to Redis before sending it to the client
            const originalJson = res.json.bind(res);

            res.json = (body) => {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redisClient.setEx(
                        key,
                        expiryInSeconds,
                        JSON.stringify(body),
                    );
                }
                originalJson(body);
            };

            next();
        } catch (error) {
            console.error("Redis Cache Error:", error);
            next();
        }
    };
};
