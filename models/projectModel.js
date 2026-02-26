import mongoose from "mongoose"


const projectSchema = new mongoose.Schema(
    {
        manager: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            trim: true,
            required: [true, "Please set your project name"],
            minlength: [2, "Name is too short"],
            maxlength: [100, "Name is too long"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, "Description is too long"],
        },
        status: {
            type: String,
            enum: ["In Progress", "Completed"],
            default: "In Progress",
        },
    },
    { timestamps: true },
);
const Project = mongoose.model("Project", projectSchema);
export default Project;
