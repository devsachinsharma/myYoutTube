import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({ 
    cloud_name: "dkgmktudt", 
    api_key: "414128953489626", 
    api_secret: "G_asvw7clV9FrHiu0KCiJFB9bFo"
    });  


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        console.log(error);
        return null;
    }
}

export {uploadOnCloudinary}

