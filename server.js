import dotenv from "dotenv";
dotenv.config({ path: "config.env" });
import express from "express";
import morgan from "morgan";
import dbConnection from "./config/database.js";
import ApiError from "./utils/apiError.js";
import globalError from "./middlewares/errorMiddleware.js";  

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
    console.log(`Mode : ${process.env.NODE_ENV}`);
}

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sample route
app.get("/", (req, res) => {
    res.status(200).json({
        data: null,
        error: null,
        message: "Welcome to the Express server!",
        statusCode: 200,
    });
});

// Routes
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import projectRoute from "./routes/projectRoute.js";
import taskRoute from "./routes/taskRoute.js";
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/projects", projectRoute);
app.use("/api/v1/tasks", taskRoute);



// 404 handler
app.use((req, res, next) => {
    next(new ApiError(`Can't find this route: ${req.originalUrl}`, 404));
});

// global error handler
app.use(globalError);

//DB Connection
dbConnection();

// Start the server
app.listen(PORT, () => {
    console.log(
        `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`,
    );
});
