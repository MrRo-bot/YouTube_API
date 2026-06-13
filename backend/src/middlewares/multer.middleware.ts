import multer from "multer";
import {
  multerFileSizeLimit,
  multerTempLocation,
  uniqueSuffix,
} from "../constants.js";

const storage = multer.diskStorage({
  //choosing destination to save files in backend server temporarily
  destination: function (
    req: any,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    cb(null, multerTempLocation);
  },
  //creating file name with unique string at the end which is common practice
  filename: function (
    req: any,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) {
    cb(
      null,
      file.originalname.split(".").slice(0, -1).join(".") +
        "-" +
        uniqueSuffix +
        "." +
        file.originalname.split(".").slice(-1)
    );
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: multerFileSizeLimit },
});
