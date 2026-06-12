import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";

const toggleVideoLike = async (req: any, res: any) => {
  const { videoId } = req.params;
  //toggle like on a video

  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID");

  try {
    const likedVideo = await Like.findOne({
      video: videoId,
    });

    if (likedVideo) {
      await Like.findByIdAndDelete(likedVideo._id);

      return res.status(200).json(
        new ApiResponse(200, true, "Disliked Video", {
          isVideoLiked: false,
        })
      );
    } else {
      // like video
      await Like.create({
        video: videoId,
        likedBy: req.user?._id,
      });

      return res.status(201).json(
        new ApiResponse(201, true, "Liked Video", {
          isVideoLiked: true,
        })
      );
    }
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while toggling video like"
    );
  }
};

const toggleCommentLike = async (req: any, res: any) => {
  const { commentId } = req.params;
  //toggle like on a comment

  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Invalid Comment ID");

  try {
    const likedComment = await Like.findOne({
      comment: commentId,
    });

    if (likedComment) {
      await Like.findByIdAndDelete(likedComment._id);

      return res.status(200).json(
        new ApiResponse(200, true, "Disliked Comment", {
          isCommentLiked: false,
        })
      );
    } else {
      // like comment
      await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
      });

      return res.status(201).json(
        new ApiResponse(201, true, "Liked Comment", {
          isCommentLiked: true,
        })
      );
    }
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while toggling comment like"
    );
  }
};

const toggleTweetLike = async (req: any, res: any) => {
  const { tweetId } = req.params;
  //toggle like on a tweet

  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid Tweet ID");

  try {
    const likedTweet = await Like.findOne({
      tweet: tweetId,
    });

    if (likedTweet) {
      await Like.findByIdAndDelete(likedTweet._id);

      return res.status(200).json(
        new ApiResponse(200, true, "Disliked Tweet", {
          isTweetLiked: false,
        })
      );
    } else {
      // like tweet
      await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id,
      });

      return res.status(201).json(
        new ApiResponse(201, true, "Liked Tweet", {
          isTweetLiked: true,
        })
      );
    }
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while toggling tweet like"
    );
  }
};

const getLikedVideos = async (req: any, res: any) => {
  //getting all liked videos of existing user
  const userId = req.user?._id;

  try {
    const user = await User.findById(userId);
    if (!isValidObjectId(userId) || !user)
      throw new ApiError(404, "User ID not found");

    const likedVideos = await Like.aggregate([
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(userId),
          video: { $exists: true, $ne: null }, // Only video likes
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "videoDetails",
        },
      },
      {
        $unwind: {
          path: "$videoDetails",
          preserveNullAndEmptyArrays: false, // Remove likes that dont have video property
        },
      },
      {
        $project: {
          likedBy: 1,
          video: "$videoDetails",
          likedAt: "$createdAt",
        },
      },
    ]);

    if (!likedVideos) throw new ApiError(404, "Liked Videos not found");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Liked Videos fetched successfully",
          likedVideos
        )
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while fetching Liked Videos"
    );
  }
};

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
