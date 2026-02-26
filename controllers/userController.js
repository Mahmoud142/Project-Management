import asyncHandler from "express-async-handler"
import bcrypt from "bcryptjs"

import ApiError from "../utils/apiError.js"
import User from "../models/userModel.js"

// @desc      Get all users
// @route     GET /api/v1/users
// @access    Private/Admin and Manager
export const getAllUsers = asyncHandler(async (req, res, next) => {
    const users = await User.find();
    users.forEach((user) => delete user._doc.password);
    res.status(200).json({ data: users });
});

// @desc      Get specific user by id
// @route     GET /api/v1/users/:id
// @access    Private/Admin and Manager
export const getUserById = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(
            new ApiError(`No user found for this id: ${req.params.id}`, 404),
        );
    }
    delete user._doc.password;
    res.status(200).json({ data: user });
});

// @desc      Create user
// @route     POST /api/v1/users
// @access    Private/Admin 
export const createUser = asyncHandler(async (req, res, next) => {
    
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        role: req.body.role,
        password: req.body.password,
    });
    delete user._doc.password;
    res.status(201).json({ data: user });
});

// @desc      Update user data without(password)
// @route     PATCH /api/v1/users/:id
// @access    Private/Admin
export const updateUserById = asyncHandler(async (req, res, next) => {
    const document = await User.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            role: req.body.role,
        },
        {
            new: true,
        },
    );

    if (!document) {
        next(
            new ApiError(
                `No document found for this id: ${req.params.id}`,
                404,
            ),
        );
    }

    // document.save();
    res.status(200).json({ data: document });
});

// @desc      Update user data without(password)
// @route     PATCH /api/v1/users/:id
// @access    Private/Admin
export const updateUserPassword = asyncHandler(async (req, res, next) => {
    const document = await User.findByIdAndUpdate(
        req.params.id,
        {
            password: await bcrypt.hash(req.body.password, 12),
            passwordChangedAt: Date.now(),
        },
        {
            new: true,
        },
    );

    if (!document) {
        next(
            new ApiError(
                `No document found for this id: ${req.params.id}`,
                404,
            ),
        );
    }

    // document.save();
    res.status(200).json({ data: document });
});

// @desc     Delete user
// @route    DELETE /api/v1/users/:id
// @access   Private/Admin
export const deleteUserById = asyncHandler(async (req, res, next) => {
    const document = await User.findByIdAndDelete(req.params.id);
    if (!document) {
        next(
            new ApiError(
                `No document found for this id: ${req.params.id}`,
                404,
            ),
        );
    }
    res.status(204).json({ status: "Success" });
});
