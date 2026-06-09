import multer from "multer";

const storage = multer.diskStorage({
  //choosing destination to save files in backend server temporarily
  destination: function (
    req: any,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    cb(null, "./public/temp");
  },
  //creating file name with unique string at the end which is common practice
  filename: function (
    req: any,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) {
    const uniqueSuffix =
      new Date(Date.now()).toJSON().slice(0, 10).split("-").join("") +
      "-" +
      Math.round(Math.random() * 1e9);
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
  limits: { fileSize: 100 * 1024 * 1024 },
});
