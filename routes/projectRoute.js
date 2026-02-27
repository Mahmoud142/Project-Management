import express from "express";

import {
    createProject,
    getAllProjects,
    getProjectById,
    updateProjectById,
    deleteProjectById,
    getProjectStats,
} from "../controllers/projectController.js";
import { auth, allowedTo } from "../controllers/authController.js";
import { cacheData } from "../middlewares/cacheMiddleware.js";
const router = express.Router();

router.get("/stats", auth, allowedTo("manager", "admin"), cacheData(100), getProjectStats);
router.get("/", auth, allowedTo("manager", "admin"), getAllProjects);
router.post("/", auth, allowedTo("manager"), createProject);
router.get("/:id", auth, allowedTo("manager", "admin"),  getProjectById);
router.patch("/:id", auth, allowedTo("manager"), updateProjectById);
router.delete("/:id", auth, allowedTo("manager"), deleteProjectById);

export default router;
