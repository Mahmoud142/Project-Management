import express from "express";

import {
    createProject,
    getAllProjects,
    getProjectById,
    updateProjectById,
    deleteProjectById,
} from '../controllers/projectController.js';
import {
    auth,
    allowedTo,
} from '../controllers/authController.js';


const router = express.Router();

router.post("/", auth, allowedTo("manager"), createProject);
router.get("/", auth, allowedTo("manager", "admin"), getAllProjects)
router.get("/:id", auth, allowedTo("manager", "admin"), getProjectById);
router.patch("/:id", auth, allowedTo("manager"), updateProjectById);
router.delete("/:id", auth, allowedTo("manager"), deleteProjectById);


export default router;
