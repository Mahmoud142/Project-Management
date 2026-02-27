import asyncHandler from "express-async-handler";
import ApiError from "../utils/apiError.js";
import Task from "../models/taskModel.js";
import Project from "../models/projectModel.js";
import User from "../models/userModel.js";
import { emailQueue } from "../queues/emailQueue.js";
import ApiFeatures from "../utils/apiFeatures.js";
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
    await emailQueue.add(
        "send-assignment-email",
        {
            taskId: task._id,
            taskTitle: task.title,
            assignedTo: task.employee, // The user ID
            managerId: req.user._id, // Assuming you have req.user from auth middleware
        },
        {
            // Advanced BullMQ options
            attempts: 3, // Retry 3 times if it fails
            backoff: 5000, // Wait 5 seconds between retries
            removeOnComplete: true, // Keep Redis clean
        },
    );
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

    // 1 - employee: can get only his tasks
    let filterObj = {};
    if (req.user.role === "employee") {
        filterObj = { employee: req.user._id };
    } else if (req.user.role === "manager") {
        // 2 - manager: can get only his projects tasks
        // we will get all projects of the manager and then get all tasks of these projects
        const projects = await Project.find({ manager: req.user._id });
        const projectIds = projects.map((project) => project._id);
        filterObj = { project: { $in: projectIds } };
    }
    const baseQuery = Task.find(filterObj).populate("project", "title");
    const features = new ApiFeatures(baseQuery, req.query)
        .filter()
        .search(["title", "description"])
        .sort()
        .limitFields();
    await features.paginate();
    const tasks = await features.query;

    res.status(200).json({
        status: "success",
        results: features.paginationResult.totalDocuments,
        data: tasks,
        pagination: features.paginationResult,
    });
});

// @desc      Get a Task
// @route     GET /api/v1/tasks/:id
// @access    Private (Limited Employee , limited Manager , Full Admin)
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

// @desc      Update a Task
// @route     PUT /api/v1/tasks/:id
// @access    Private (Employee & Manager)
export const updateTask = asyncHandler(async (req, res, next) => {
    // Employee can only update task status
    // Manager can update task details (title, description, dueDate, employee) but not status
    // Admin has full access

    let task;
    const validStatuses = ["pending", "in progress", "completed"];

    if (req.user.role === "employee") {
        // 1 - Find task that belongs to the employee
        task = await Task.findOne({
            _id: req.params.id,
            employee: req.user._id,
        });

        if (!task) {
            return next(
                new ApiError(
                    "Task not found or you are not assigned to this task",
                    404,
                ),
            );
        }

        // 2 - Employee can only update status
        if (!req.body.status) {
            return next(new ApiError("Please provide a status to update", 400));
        }

        // 3 - Validate status value
        if (!validStatuses.includes(req.body.status)) {
            return next(
                new ApiError(
                    `Invalid status. Status must be one of: ${validStatuses.join(", ")}`,
                    400,
                ),
            );
        }

        // 4 - Update the task status
        task.status = req.body.status;
        console.log("This is task before email queue:", task);
        if (req.body.status === "completed") {
            await emailQueue.add("sendManagerEmail", {
                taskTitle: task.title,
                managerId: task.project.manager,
            });
        }
    } else if (req.user.role === "manager") {
        // 1 - Find task in manager's projects
        const projects = await Project.find({
            manager: req.user._id,
        });
        const projectIds = projects.map((project) => project._id);

        task = await Task.findOne({
            _id: req.params.id,
            project: { $in: projectIds },
        });

        if (!task) {
            return next(
                new ApiError(
                    "Task not found or you are not the manager of this project",
                    404,
                ),
            );
        }

        // 2 - Manager cannot update status (only employee can)
        if (req.body.status) {
            return next(
                new ApiError(
                    "Managers cannot update task status. Only assigned employees can update status.",
                    403,
                ),
            );
        }

        // 3 - Update allowed fields
        if (req.body.title !== undefined) {
            task.title = req.body.title;
        }
        if (req.body.description !== undefined) {
            task.description = req.body.description;
        }
        if (req.body.dueDate !== undefined) {
            task.dueDate = req.body.dueDate;
        }

        // 4 - Allow manager to reassign task to different employee
        if (req.body.employee) {
            // Validate that the new employee exists and has employee role
            const employee = await User.findOne({
                _id: req.body.employee,
                role: "employee",
            });
            if (!employee) {
                return next(
                    new ApiError(
                        "Employee not found or user is not an employee",
                        404,
                    ),
                );
            }
            task.employee = req.body.employee;
        }
    }

    // Save the updated task
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
