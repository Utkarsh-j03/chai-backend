import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload file on cloudinary

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    console.log("error while uploading to cloudinary:", error);

    fs.unlinkSync(localFilePath); //remove locally saved temp file as the upload failed
  }
};

export { uploadOnCloudinary };
