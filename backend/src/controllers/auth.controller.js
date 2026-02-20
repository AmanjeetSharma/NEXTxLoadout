import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import fs from 'fs';
import { User } from '../models/user.model.js';
import { generateAccessToken, generateRefreshToken, generateSessionId } from '../utils/token.js';
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { emailValidator, usernameValidator, passwordValidator, avatarValidator } from "../utils/validators.js";


const register = asyncHandler(async (req, res) => {
    if (!req.body) {
        throw new ApiError(400, "Request body is missing");
    }

    const { username, name, email, password } = req.body;

    const requiredFields = { username, name, email, password };

    for (const [key, value] of Object.entries(requiredFields)) {
        if (!value?.trim()) {
            throw new ApiError(400, `${key} is required`);
        }
    }

    if (!emailValidator(email)) {
        throw new ApiError(400, "Please provide a valid email address");
    }
    if (!usernameValidator(username)) {
        throw new ApiError(400, "Username must be 3-20 chars, only letters, numbers, or underscores");
    }
    if (!passwordValidator(password)) {
        throw new ApiError(400, "Password must be at least 8 chars, include uppercase, lowercase, number, and special char");
    }

    let existingUser = await User.findOne({
        $or: [
            { email: email.toLowerCase() },
            { username: username.toLowerCase() }
        ]
    });

    // Check avatar file
    const avatarFile = req?.files?.avatar?.[0];
    if (avatarFile && !avatarValidator(avatarFile)) {
        fs.unlinkSync(avatarFile.path);
        console.log("🗑️  Removed avatar image from localServer due to → invalid format or size.");
        throw new ApiError(400, "Invalid avatar: must be JPEG/PNG/WebP and ≤ 5 MB");
    }

    // If user already exists
    if (existingUser) {
        if (existingUser.email === email.toLowerCase()) {
            if (existingUser.password) {
                if (avatarFile?.path) {
                    fs.unlinkSync(avatarFile.path);
                    console.log("🗑️  Removed avatar image from localServer due to → existing user with password.");
                }
                throw new ApiError(409, "A user already exists with this email");
            } else {
                // Google-only account — allow them to set password
                const hashedPassword = await bcrypt.hash(password, 10);
                existingUser.password = hashedPassword;
                existingUser.username = username.toLowerCase();
                existingUser.name = name.trim();

                if (avatarFile?.path) {
                    const avatarResult = await uploadOnCloudinary(avatarFile.path, "Work-in-Progress/users/avatars");
                    if (!avatarResult) {
                        throw new ApiError(500, "⚠️ Error uploading avatar image");
                    }
                    existingUser.avatar = avatarResult.url || "";
                }

                await existingUser.save();

                const updatedUser = await User.findById(existingUser._id).select("-password -sessions");

                return res.status(200).send(new ApiResponse(200, updatedUser, "✅ Password set successfully. You can now login using email/password or Google."));
            }
        }

        // Username conflict check
        if (existingUser.username === username.toLowerCase()) {
            if (avatarFile?.path) {
                fs.unlinkSync(avatarFile.path);
                console.log("🗑️  Removed avatar image from localServer due to → username conflict.");
            }
            throw new ApiError(409, "A user already exists with this username. Please choose a different username.");
        }
    }


    // If no existing user, normal jwt creation of new user
    const hashedPassword = await bcrypt.hash(password, 10);

    let avatar = null;
    let avatarLocalPath = avatarFile?.path;
    if (avatarLocalPath) {
        let avatarResult = await uploadOnCloudinary(avatarLocalPath, "Work-in-Progress/users/avatars");
        if (!avatarResult) {
            throw new ApiError(500, "⚠️ Error uploading avatar image");
        }
        avatar = avatarResult;
    }

    const newUser = await User.create({
        username: username.toLowerCase(),
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        avatar: avatar?.url || "",
    });

    const isUserCreated = await User.findById(newUser._id).select("-password -sessions");

    if (!isUserCreated) {
        throw new ApiError(500, "Error while registering the user");
    }

    return res
        .status(201)
        .send(new ApiResponse(201, isUserCreated, "✅ User registered successfully"));
});










const login = asyncHandler(async (req, res) => {
    if (!req.body) {
        throw new ApiError(400, "Request body is missing");
    }

    const { email, password, device } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        throw new ApiError(401, "User does not exist");
    }

    // Check if password is set
    if (!user.password) {
        throw new ApiError(401, "User is registered with Google Account. Please register your account with a password to login using email/password.");
    }


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new ApiError(401, "Invalid password");
    }

    const sessionId = generateSessionId();
    const refreshToken = generateRefreshToken(user._id, sessionId);
    const accessToken = generateAccessToken(user);

    let existingSession = user.sessions.find(
        (s) => s.device === (device || "Unknown Device")
    );

    if (existingSession) {
        existingSession.sessionId = sessionId;
        existingSession.refreshToken = refreshToken;
        existingSession.latestLogin = new Date();
        existingSession.isActive = true;
    } else {
        const newSession = {
            sessionId,
            device: device || "Unknown Device",
            refreshToken,
            firstLogin: new Date(),
            latestLogin: new Date(),
            isActive: true
        };
        user.sessions.push(newSession);
    }

    await user.save();

    const loggedInUser = await User.findById(user._id).select("-password -sessions");

    // Set cookies
    const options = {
        httpOnly: true,
        secure: true, // set to true in production
        sameSite: 'None',
        path: '/',
    };

    console.log(`✅  ${user.name} logged in successfully. Device: ${device || "Unknown Device"}`);

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser
                },
                "✅ User logged in successfully"
            )
        );
});








const logout = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) {
        console.log("🚫🔑  No token provided");
        throw new ApiError(401, "No token provided");
    }

    const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken.id);
    if (!user) {
        console.log("✅ Done: Logout — User not found");
        throw new ApiError(404, "User not found");
    }

    const session = user.sessions.find((s) => s.sessionId === decodedToken.sessionId && s.refreshToken === token);
    if (session) {
        session.isActive = false;
        session.refreshToken = null;  // Set refresh token to null
        await user.save();
    }
    const options = {
        httpOnly: true,
        secure: true, // set to true in production
        sameSite: 'None',
        path: '/',
    };

    console.log(`✅  ${user.name} logged out successfully from device: ${session?.device || "Unknown Device"}`);
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});









const logoutAllDevices = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken;  // Assuming the refresh token is in the cookies
    if (!token) {
        console.log("🚫🔑 No token found");
        throw new ApiError(401, "No token provided");
    }

    const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    // console.log("decodedToken id:", decodedToken.id);
    const user = await User.findById(decodedToken.id);

    if (!user) {
        console.log("❌ User not found");
        throw new ApiError(404, "User not found");
    }

    user.sessions.forEach((session) => {
        session.isActive = false;
    });

    user.sessions.forEach((session) => {
        session.refreshToken = null;  // Set refresh token to null
    });

    await user.save();

    const options = {
        httpOnly: true,
        secure: true, // Set to true in production
        sameSite: 'None',
        path: '/',
    };

    console.log(`✅  ${user.name} logged out successfully from all devices: ${user.sessions.map(s => s.device || "Unknown Device").join(", ")}`);
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully from all devices"));
});









const refresh = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) {
        console.log("🚫🔑 No refresh token provided (RefreshHandler.controller)");
        throw new ApiError(401, "No refresh token provided");
    }

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
        console.log("❌ User not found");
        throw new ApiError(404, "User not found");
    }

    const session = user.sessions.find(
        (s) => s.sessionId === decoded.sessionId && s.refreshToken === token && s.isActive
    );

    if (!session) {
        console.log("❌ Invalid session or session is inactive");
        throw new ApiError(403, "Invalid session or session is inactive");
    }

    const newAccessToken = generateAccessToken(user);

    session.latestLogin = new Date();
    await user.save();

    console.log(`✅  Access token refreshed successfully for user: "${user.name}" . Device: ${session.device || "Unknown Device"}`);
    return res
        .status(200)
        .cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: true, // set to true in production
            sameSite: 'None',
            Path: '/',
        })
        .json(new ApiResponse(200, { accessToken: newAccessToken }, "✅  Access token refreshed successfully"));
});



export { register, login, refresh, logout, logoutAllDevices };

