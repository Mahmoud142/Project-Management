import express from "express";
import { uploadUserImage } from "../middlewares/uploadMiddleware.js";

import {
    getAllUsers,
    getUserById,
    createUser,
    updateUserById,
    updateUserPassword,
    deleteUserById,
    updateProfileImage,
} from "../controllers/userController.js";

import { auth, allowedTo } from "../controllers/authController.js";

const router = express.Router();
// Admin Route
router.patch("/profile-image", auth, uploadUserImage, updateProfileImage);
router.post("/", auth, allowedTo("admin"), createUser);
router.patch("/:id", auth, allowedTo("admin"), updateUserById);
router.patch("/changePassword/:id", auth, allowedTo("admin"), updateUserPassword);
router.delete("/:id", auth, allowedTo("admin"), deleteUserById);

// Admin and Manager Route
router.get("/", auth, allowedTo("admin", "manager"), getAllUsers);
router.get("/:id", auth, allowedTo("admin", "manager"), getUserById);


export default router;
