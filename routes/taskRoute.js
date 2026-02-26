import express from "express";

import {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask
} from '../controllers/taskController.js';
import {
    auth,
    allowedTo,
} from '../controllers/authController.js';


const router = express.Router();

router.post("/", auth, allowedTo("manager"), createTask);
router.get("/", auth, getAllTasks);
router.get("/:id", auth, getTaskById);
router.patch("/:id", auth, allowedTo("employee",'manager'), updateTask);
router.delete("/:id", auth, allowedTo("manager"), deleteTask);

export default router;
