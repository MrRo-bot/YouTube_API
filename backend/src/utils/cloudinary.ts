import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import config from "../config/config.js";

const publicIdFromUrl = (url: string): string => {
  const clean = url.split("?")[0];
  // https://res.cloudinary.com/<cloud>/image/upload/v123456/folder/sub/file.jpg
  // https://res.cloudinary.com/<cloud>/image/upload/folder/sub/file.jpg (no version)
  // getting everything after /upload/ and removing extension and any leading version token v12345/
  const afterUpload = clean.split("/upload/")[1];
  // removing leading version (v123456/) if present
  const withoutVersion = afterUpload.replace(/^v\d+\//, "");
  // stripping file extension
  return withoutVersion.replace(/\.[^/.]+$/, "");
};

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

const deleteFromCloudinary = async (url: string) => {
  try {
    if (!url) return null;

    //deleting the existing image from cloudinary to make way for new updated ones
    const response = cloudinary.uploader.destroy(publicIdFromUrl(url), {
      invalidate: true,
    });

    return response;
  } catch (error: any | { message: string }) {
    console.error(error.message || "Something went wrong while deleting file");
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
