import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            trim: true,
            required: [true, "Please set your task name"],
            minlength: [2, "Name is too short"],
            maxlength: [100, "Name is too long"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description is too long"],
        },
        status: {
            type: String,
            enum: ["pending", "in progress", "completed"],
            default: "pending",
        },
        dueDate: {
            type: Date,
            required: [true, "Task must have a deadline"],
        },
    },
    { timestamps: true },
);

const Task = mongoose.model("Task", taskSchema);
export default Task;
