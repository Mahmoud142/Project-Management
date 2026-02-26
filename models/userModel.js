import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: [true, "Please set your name"],
            minlength: [2, "name min length 2 characters"],
            maxlength: [100, "name max length 100 characters"],
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        phone: String,
        password: {
            type: String,
            required: [true, "Please set your password"],
            minlength: [6, "password min length 6"],
        },
        passwordChangedAt: Date,
        passwordResetCode: String,
        passwordResetExpires: Date,
        resetCodeVerified: Boolean,
        role: {
            type: String,
            enum: ["admin", "manager", "employee"],
            default: "employee",
        },
    },
    { timestamps: true },
);

// Document Middleware that automatically run before save user document
userSchema.pre("save", async function (next) {
    // Only run this function if password was actually modified
    if (!this.isModified("password")) return next();
    // Hash the password with the cost 12
    this.password = await bcrypt.hash(this.password, 12);
});

const User = mongoose.model("User", userSchema);

export default User;
