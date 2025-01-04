import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, // cloudinary URL
        required: true,
    },
    coverImage: {
        type: String
    },
    watchHistory:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is reuired."],
    },
    refreshToken: {
        type: String
    }
}, {
    timestamps: true
}
)

export const User = mongoose.model("User", userSchema);