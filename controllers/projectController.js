import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";
import Project from "../models/projectModel.js";
import Task from "../models/taskModel.js";
import { clearKey } from "../utils/clearCache.js";
// @desc      Create a project
// @route     POST /api/v1/projects
// @access    Private (manager only)
export const createProject = asyncHandler(async (req, res, next) => {
    // only manager can create a project,
    // the manager is the owner of the project
    const project = await Project.create({
        manager: req.user._id,
        title: req.body.title,
        description: req.body.description,
    });

    // Clear the cache for the stats and the main list
    await clearKey("/api/v1/projects/stats");
    await clearKey("/api/v1/projects");

    res.status(201).json({
        status: "success",
        message: "Project created successfully",
        data: project,
    });
});
// @desc      get all projects
// @route     GET /api/v1/projects
// @access    Private (Limited access for manager, Full access for admin)
export const getAllProjects = asyncHandler(async (req, res, next) => {
    // the user is a manager or admin
    // if manager, get only his projects
    if (req.user.role === "manager") {
        const projects = await Project.find({ manager: req.user._id });
        return res.status(200).json({
            status: "success",
            message: "Projects retrieved successfully",
            data: projects,
        });
    }
    // the user is an admin, get all projects
    const projects = await Project.find();
    res.status(200).json({
        status: "success",
        message: "Projects retrieved successfully",
        data: projects,
    });
});

// @desc      get a project by id
// @route     GET /api/v1/projects
// @access    Private (Limited access for manager, Full access for admin)
export const getProjectById = asyncHandler(async (req, res, next) => {
    // the user is a manager or admin
    // if manager, check if the project belongs to him
    if (req.user.role === "manager") {
        const project = await Project.findOne({
            _id: req.params.id,
            manager: req.user._id,
        });
        if (!project) {
            return next(new ApiError("Project not found", 404));
        }
        return res.status(200).json({
            status: "success",
            message: "Project retrieved successfully",
            data: project,
        });
    }

    // the user is an admin, get the project any way
    const project = await Project.findById(req.params.id);
    if (!project) {
        return next(new ApiError("Project not found", 404));
    }
    res.status(200).json({
        status: "success",
        message: "Project retrieved successfully",
        data: project,
    });
});

// @desc      get a project by id
// @route     GET /api/v1/projects
// @access    Private manager only (the manager is the owner of the project)
export const updateProjectById = asyncHandler(async (req, res, next) => {
    // only manager can update a project,
    // the manager is the owner of the project
    const project = await Project.findOneAndUpdate(
        { _id: req.params.id, manager: req.user._id },
        {
            title: req.body.title,
            description: req.body.description,
            status: req.body.status,
        },
        { new: true },
    );
    if (!project) {
        return next(new ApiError("Project not found", 404));
    }
    
    // Clear the cache for the stats and the main list
    await clearKey("/api/v1/projects/stats");
    await clearKey("/api/v1/projects");

    res.status(200).json({
        status: "success",
        message: "Project updated successfully",
        data: project,
    });
});

// @desc      Delete Project by id
// @route     DELETE /api/v1/projects/:id
// @access    Private manager only (the manager is the owner of the project)
export const deleteProjectById = asyncHandler(async (req, res, next) => {
    // only manager can delete a project,
    // the manager is the owner of the project
    const project = await Project.findOneAndDelete({
        _id: req.params.id,
        manager: req.user._id,
    });
    if (!project) {
        return next(new ApiError("Project not found", 404));
    }
    // Clear the cache for the stats and the main list
    await clearKey("/api/v1/projects/stats");
    await clearKey("/api/v1/projects");

    res.status(204).json({
        status: "success",
        message: "Project deleted successfully",
        data: null,
    });
});

// @desc      Get project stats
// @route     GET /api/v1/projects/stats
// @access    Private (Limited access for manager, Full access for admin)
export const getProjectStats = asyncHandler(async (req, res, next) => {
    const stats = await Task.aggregate([
        {
            $group: {
                _id: "$project",
                numTasks: { $sum: 1 },
                completedTasks: {
                    $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
            },
        },

        {
            $lookup: {
                from: "projects",
                localField: "_id",
                foreignField: "_id",
                as: "projectDetails",
            },
        },

        {
            $unwind: "$projectDetails",
        },

        {
            $project: {
                _id: 0,
                projectName: "$projectDetails.title",
                totalTasks: "$numTasks",
                completedTasks: 1,
            },
        },
    ]);

    res.status(200).json({
        message: "Project stats retrieved successfully",
        status: "success",
        data: stats,
    });
});
