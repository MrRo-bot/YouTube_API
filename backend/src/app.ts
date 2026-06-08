import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config/config.js";

const app = express();

app.use(
  cors({
    origin: config.cors_origin,
    credentials: true,
  })
);

app.use(cookieParser());

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

app.use(express.static("public"));

//order of defining things is important in backend
import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter);

export { app, express };
