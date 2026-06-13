export const DB_NAME = "chaiorbackend";
export const cookieOptions = {
  httpOnly: true,
  secure: true,
};
export const videoPage = 1;
export const videoLimit = 10;
export const commentPage = 1;
export const commentLimit = 10;
export const healthCheckData = {
  uptime: process.uptime(),
  message: "Ok",
  date: new Date(),
};
export const validSortFields = [
  "createdAt",
  "title",
  "views",
  "duration",
  "updatedAt",
];
export const multerTempLocation = "./public/temp";
export const multerFileSizeLimit = 100 * 1024 * 1024;
export const uniqueSuffix =
  new Date(Date.now()).toJSON().slice(0, 10).split("-").join("") +
  "-" +
  Math.round(Math.random() * 1e9);
