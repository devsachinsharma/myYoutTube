import dotenv from "dotenv";
import {app} from "./app.js"
import cors from "cors";
import connectDB from "./db/index.js";
import cookieParser from "cookie-parser";
import express from "express";
dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true})); 
app.use(express.static("folder_name"));
app.use(cookieParser());

connectDB();
app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running on port: ${process.env.PORT}`);
})