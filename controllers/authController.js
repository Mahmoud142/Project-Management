import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import ApiError from "../utils/apiError.js";
import User from "../models/userModel.js";

// @desc      Signup
// @route     POST /api/v1/auth/signup
// @access    Public
export const signup = asyncHandler(async (req, res) => {
    const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

    delete user._doc.password;
    res.status(201).json({ data: user, token });
});

// @desc      Login
// @route     POST /api/v1/auth/login
// @access    Public
export const login = asyncHandler(async (req, res, next) => {
    // 1) Check of email and password exist in the body (validation layer)
    // 2) Check if user exist && password correct
    const user = await User.findOne({ email: req.body.email }).select("+password");

    let isCorrectPassword = false;
    if (user) {
        isCorrectPassword = await bcrypt.compare(
            req.body.password,
            user.password,
        );
    }

    if (!user || !isCorrectPassword) {
        return next(new ApiError("Incorrect email or password"), 401);
    }
    // 3) Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // delete the password from the response
    // https://stackoverflow.com/questions/18821212/mongoose-whats-up-with-doc#:~:text=_doc%20exist%20on%20the%20mongoose,from%20the%20database%2C%20because%20console.
    delete user._doc.password;

    res.status(200).json({ data: user, token });
});

// @desc     Make sure that user is logged in
export const auth = asyncHandler(async (req, res, next) => {
    // 1- Get the token and check if exists
    // console.log(req.headers);
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
        // console.log(token);
    }
    if (!token) {
        return next(
            new ApiError(
                "You are not logged in. Please login to get access",
                401,
            ),
        );
    }
    // 2- Verify the token (check if the token changes the payload or the token is expired)
    // two errors maybe happens : 1- invalid token 2- expired token
    // convert a method that returns responses using a callback function to return a responses in a promise object
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded);

    // 3- Check the user exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
            new ApiError(
                "The user that belong to this token does no longer exist",
            ),
        );
    }
    // 4- Check if user change his password after generating the token
    if (currentUser.passwordChangedAt) {
        const passChangedTimestamp = parseInt(
            currentUser.passwordChangedAt.getTime() / 1000,
            10,
        );
        if (passChangedTimestamp > decoded.iat) {
            return next(
                new ApiError(
                    "User recently changed password! Please login again..",
                    401,
                ),
            );
        }
        // console.log(passChangedTimestamp, decoded.iat);
    }
    // Grant access to the protected routes
    req.user = currentUser;
    next();
});

// Authorization check if the certain user is allowed to access the specific route or not allowed
// even is logged in because not all logged in users able to access the routes
// authController.allowedTo( c) ...roles  => rest parameter syntax es6
export const allowedTo = (...roles) =>
    asyncHandler(async (req, res, next) => {
        // ["admin"] or ["admin", "manager"]
        if (!roles.includes(req.user.role)) {
            return next(
                new ApiError("You are not allowed to perform this action", 403),
            );
        }
        next();
    });


