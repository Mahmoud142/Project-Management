import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config({ path: "config.env" });

import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

// DB & Error Handling Imports
import dbConnection from "./config/database.js";
import ApiError from "./utils/apiError.js";
import globalError from "./middlewares/errorMiddleware.js";
import { connectRedis } from "./config/redisClient.js";
import "./queues/emailQueue.js";

// Routes Imports (Must be at the top)
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import projectRoute from "./routes/projectRoute.js";
import taskRoute from "./routes/taskRoute.js";

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Create HTTP server wrapping the Express app
const server = http.createServer(app);

// 2. Initialize Socket.io
export const io = new Server(server, {
    cors: {
        origin: "*",
    },
});
io.use((socket, next) => {
    try {

        let token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization ||
            socket.handshake.query?.token;


        if (token && token.startsWith("Bearer ")) {
            token = token.split(" ")[1];
        }

        if (!token) {
            console.log("[Socket.io] Connection rejected: No token provided");
            return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET_KEY || process.env.JWT_SECRET,
        );

        socket.user = decoded;
        next();
    } catch (err) {
        console.log("[Socket.io] Connection rejected: Invalid token");
        return next(new Error("Authentication error: Invalid token"));
    }
});
io.on("connection", (socket) => {
    console.log(`[Socket.io] New client connected: ${socket.id}`);

    socket.on("join-room", (userId) => {
        // .trim() removes any hidden spaces or newlines
        const cleanId = userId.trim();

        socket.join(cleanId);
        console.log(`[Socket.io] Room Joined: [${cleanId}]`);
    });
    socket.on("disconnect", () => {
        console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
});
app.use((req, res, next) => {
    req.io = io;
    next();
});
// ==========================================
// 1. GLOBAL MIDDLEWARES (The Security Guards)
// ==========================================

// Set security HTTP headers
app.use(helmet());
app.use(cors());
app.options(/.*/, cors());
// Limit requests from same API
const limiter = rateLimit({
    max: 100, // Limit each IP to 100 requests per `window`
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// ==========================================
// 2. BODY PARSERS (Unpacking the Data)
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Middleware to parse JSON bodies (MUST BE BEFORE SANITIZATION)
app.use((req, res, next) => {
    Object.defineProperty(req, "query", {
        ...Object.getOwnPropertyDescriptor(req, "query"),
        value: req.query,
        writable: true,
    });
    next();
});

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// ==========================================
// 3. STATIC FILES & LOGGING
// ==========================================
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
    console.log(`Mode : ${process.env.NODE_ENV}`);
}

// Serve static files (like uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==========================================
// 4. ROUTES
// ==========================================

// Sample route
app.get("/", (req, res) => {
    res.status(200).json({
        data: null,
        error: null,
        message: "Welcome to the Express server!",
        statusCode: 200,
    });
});

// API Routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/projects", projectRoute);
app.use("/api/v1/tasks", taskRoute);

// ==========================================
// 5. ERROR HANDLING (The Safety Nets)
// ==========================================

// Unhandled routes (404 handler)
app.use((req, res, next) => {
    next(new ApiError(`Can't find this route: ${req.originalUrl}`, 404));
});

// Global error handler
app.use(globalError);

// ==========================================
// 6. DB CONNECTION & SERVER START
// ==========================================

dbConnection();
connectRedis();

server.listen(PORT, () => {
    console.log(
        `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`,
    );
});
