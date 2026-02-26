import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config({ path: "config.env" });

import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

// DB & Error Handling Imports
import dbConnection from "./config/database.js";
import ApiError from "./utils/apiError.js";
import globalError from "./middlewares/errorMiddleware.js";

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

// ==========================================
// 1. GLOBAL MIDDLEWARES (The Security Guards)
// ==========================================

// Set security HTTP headers
app.use(helmet());

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
    Object.defineProperty(req, 'query', {
        ...Object.getOwnPropertyDescriptor(req, 'query'),
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

app.listen(PORT, () => {
    console.log(
        `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`,
    );
});
