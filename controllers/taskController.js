import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";
import Task from "../models/taskModel.js";
import Project from "../models/projectModel.js";
import User from "../models/userModel.js";

// @desc      Create a Task
// @route     POST /api/v1/tasks
// @access    Private (manager only)
export const createTask = asyncHandler(async (req, res, next) => {
    // only manager can create a task,
    // the manager is the owner of the project

    // 1 - check if the project belongs to the manager
    const project = await Project.findOne({
        _id: req.body.project,
        manager: req.user._id,
    });
    if (!project) {
        return next(
            new ApiError(
                "Project not found or you are not the owner of the project",
                404,
            ),
        );
    }
    // 2 - check if the employee exists and is an employee
    const employee = await User.findOne({
        _id: req.body.employee,
        role: "employee",
    });
    if (!employee) {
        return next(
            new ApiError("Employee not found or user is not an employee", 404),
        );
    }
    // 3 - create the task
    const task = await Task.create({
        project: req.body.project,
        employee: req.body.employee,
        title: req.body.title,
        description: req.body.description,
        dueDate: req.body.dueDate,
    });

    res.status(201).json({
        status: "success",
        message: "Task created successfully",
        data: task,
    });
});

// @desc      Get all Tasks (Full Admin, Limited Manager,Limited Employee)
// @route     GET /api/v1/tasks
// @access    Private
export const getAllTasks = asyncHandler(async (req, res, next) => {
    // We have 3 roles (Admin, Manager, Employee)
    let tasks;
    // 1 - employee: can get only his tasks
    if (req.user.role === "employee") {
        tasks = await Task.find({ employee: req.user._id }).populate(
            "project",
            "title",
        );
    } else if (req.user.role === "manager") {
        // 2 - manager: can get only his projects tasks
        // we will get all projects of the manager and then get all tasks of these projects
        const projects = await Project.find({ manager: req.user._id });
        const projectIds = projects.map((project) => project._id);
        tasks = await Task.find({ project: { $in: projectIds } }).populate(
            "project",
            "title",
        );
    } else {
        // 3 - admin: can get all tasks
        tasks = await Task.find().populate("project", "title");
    }

    res.status(200).json({
        status: "success",
        results: tasks.length,
        data: tasks,
    });
});

// @desc      Get a Task (Full Admin, Limited Manager,Limited Employee)
// @route     GET /api/v1/tasks/:id
// @access    Private
export const getTaskById = asyncHandler(async (req, res, next) => {
    // We have 3 roles (Admin, Manager, Employee)
    let task;
    // 1 - employee: can get only his tasks
    if (req.user.role === "employee") {
        task = await Task.findOne({
            _id: req.params.id,
            employee: req.user._id,
        }).populate("project", "title");
    } else if (req.user.role === "manager") {
        // 2 - manager: can get only his projects tasks
        // we will get all projects of the manager and then get all tasks of these projects
        const projects = await Project.find({ manager: req.user._id });
        const projectIds = projects.map((project) => project._id);
        task = await Task.findOne({
            _id: req.params.id,
            project: { $in: projectIds },
        }).populate("project", "title");
    } else {
        // 3 - admin: can get all tasks
        task = await Task.findById(req.params.id).populate("project", "title");
    }

    if (!task) {
        return next(new ApiError("Task not found", 404));
    }

    res.status(200).json({
        status: "success",
        data: task,
    });
});

// @desc      Get a Task (Full Admin, Limited Manager,Limited Employee)
// @route     GET /api/v1/tasks/:id
// @access    Private (Employee only)
export const updateTask = asyncHandler(async (req, res, next) => {
    // only employee can update the task status to completed
    // the manager can update the task details but not the status

    if (req.user.role === "employee") {
        // 1 - check if the task belongs to the employee
        const task = await Task.findOne({
            _id: req.params.id,
            employee: req.user._id,
        });
        if (!task) {
            return next(
                new ApiError(
                    "Task not found or you are not the owner of the task",
                    404,
                ),
            );
        }
            // 2 - update the task status to completed
        task.status = req.body.status;
    } else {
        // 1 - check if the project belongs to the manager
        const project = await Project.find({
            manager: req.user._id,
        });
        const projectIds = project.map((project) => project._id);
        const task = await Task.findOne({
            _id: req.params.id,
            project: { $in: projectIds },
        });
        if (!task) {
            return next(
                new ApiError(
                    "Task not found or you are not the owner of the task",
                    404,
                ),
            );
        }
        // 2 - update the task details
        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.dueDate = req.body.dueDate || task.dueDate;
    }


    await task.save();
    
    res.status(200).json({
        status: "success",
        message: "Task updated successfully",
        data: task,
    });
});

// @desc      Delete a Task
// @route     DELETE /api/v1/tasks/:id
// @access    Private (Manager only)
export const deleteTask = asyncHandler(async (req, res, next) => {
    // only manager can delete a task,

    // 1 - check if the project belongs to the manager
    //      a-seach for the task to get the project id
    //      b- search for the project with the project id and the manager id

    const project = await Project.find({
        manager: req.user._id,
    });
    const projectIds = project.map((project) => project._id);
    const task = await Task.findOne({
        _id: req.params.id,
        project: { $in: projectIds },
    });
    if (!task) {
        return next(
            new ApiError(
                "Task not found or you are not the owner of the task",
                404,
            ),
        );
    }
    // 2 - delete the task
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
        return next(new ApiError("Task not found", 404));
    }

    res.status(204).json({
        status: "success",
        message: "Task deleted successfully",
    });
});
