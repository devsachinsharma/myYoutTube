import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessTokens();
        const refreshToken = user.generateRefreshTokens();

        user.refreshToken = refreshToken;
        user.save(); //Error

        return {refreshToken, accessToken};

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    const {username, email, fullname, password} = req.body;
    if([username, email, fullname, password].some((field) => {
        field?.trim() === ""
    })){
        throw new ApiError(400, "All fields are required.");
    }

    const existingUSer = await User.findOne({
        $or: [{email}, {username}]
    });

    if(existingUSer){
        throw new ApiError(409, "email or username already exists.");
    }
 
    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage[0].length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
   

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )


});

const loginUser = asyncHandler(async (req, res) => {
    const {username, email, password} = req.body;

    if(!username && !email){
        return new ApiError(400, "username or email is required");
    }

    const user = await User.findOne({
        $or: [
            {username}, {email}
        ]
    })

    if(!user){
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials");
    }

    const { refreshToken, accessToken} = await generateAccessAndRefereshTokens(user._id);
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
        user: loggedInUser, accessToken, refreshToken
    });
});

const logoutUser = asyncHandler(async(req, res) => {
    
    const user = await User.findByIdAndUpdate(req.user._id,{$set: {refreshToken: undefined}},{new: true});

    const options = {
        httpOnly: true,
        secure: true
    }

    res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User logged out successfully")
    )

});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if(!incomingRefreshToken){
        new ApiError(401, "Unauthorized Request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);
        if(!user){
            new ApiError(401, "Invalid refresh token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            new ApiError(401, "Refresh token is expired or used");
        }
    
        const { refreshToken, accessToken} = await generateAccessAndRefereshTokens(user._id);
        
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken},
                "Access token refreshed"
            )
        );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});


export {registerUser, loginUser, logoutUser, refreshAccessToken};