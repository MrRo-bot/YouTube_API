import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import config from "../config/config.js";
import { publicIdFromUrl } from "./functions.js";

cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_cloud_api_key,
  api_secret: config.cloudinary_cloud_secret,
});

const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;

    //uploading file to cloudinary and letting it detect what format i'm uploading using resource_type option
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);
    return response;
  } catch (error: any | { message: string }) {
    console.error(
      error.message || "Something went wrong while uploading files"
    );
    //unlinking synchonously to keep server file system clean
    fs.unlinkSync(localFilePath);
  }
};

const deleteFromCloudinary = async (url: string, resource_type: string) => {
  try {
    if (!url) return null;

    //deleting the existing image from cloudinary to make way for new updated ones
    const response = await cloudinary.uploader.destroy(publicIdFromUrl(url), {
      invalidate: true,
      resource_type,
    });

    return response;
  } catch (error: any | { message: string }) {
    console.error(error.message || "Something went wrong while deleting file");
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
