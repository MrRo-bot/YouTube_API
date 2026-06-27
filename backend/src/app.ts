import express from "express";
import limiter from "./utils/rateLimiter.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config/config.js";

const app = express();

//json format manager middleware
app.use(express.json());

//rate limiter middleware
app.use(limiter);

//cors middleware
app.use(
  cors({
    origin: config.cors_origin,
    credentials: true,
  })
);

//cookies parsing middleware
app.use(cookieParser());

//json payload limit middleware
app.use(
  express.json({
    limit: "16kb",
  })
);

//urlencoding middleware for form data i think
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

//static file serving middleware
app.use(express.static("public"));

//order of defining things is important in backend
import userRouter from "./routes/user.route.js";
import healthcheckRouter from "./routes/healthcheck.route.js";
import dashboardRouter from "./routes/dashboard.route.js";
import subscriptionRouter from "./routes/subscription.route.js";
import videoRouter from "./routes/video.route.js";
import tweetRouter from "./routes/tweet.route.js";
import commentRouter from "./routes/comment.route.js";
import likeRouter from "./routes/like.route.js";
import playlistRouter from "./routes/playlist.route.js";

//route declaration
app.use("/api/v1/health-check", healthcheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);

export { app, express };
