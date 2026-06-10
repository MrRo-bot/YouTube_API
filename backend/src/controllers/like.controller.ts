import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const toggleVideoLike = async (req: any, res: any) => {
  const { videoId } = req.params;
  //TODO: VERIFY toggle like on video

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
      });

      return res.status(201).json(
        new ApiResponse(201, true, "Liked Video", {
          isVideoLiked: true,
        })
      );
    }
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while toggling video like"
    );
  }
};

const toggleCommentLike = async (req: any, res: any) => {
  const { commentId } = req.params;
  //TODO: VERIFY toggle like on comment

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
      });

      return res.status(201).json(
        new ApiResponse(201, true, "Liked Comment", {
          isCommentLiked: true,
        })
      );
    }
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while toggling comment like"
    );
  }
};

const toggleTweetLike = async (req: any, res: any) => {
  const { tweetId } = req.params;
  //TODO: VERIFY toggle like on tweet

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
      });

      return res.status(201).json(
        new ApiResponse(201, true, "Liked Tweet", {
          isTweetLiked: true,
        })
      );
    }
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while toggling tweet like"
    );
  }
};

const getLikedVideos = async (req: any, res: any) => {
  //TODO: VERIFY get all liked videos
  const { userId } = req.user?._id;

  try {
    if (!isValidObjectId(userId)) throw new ApiError(404, "User ID not found");

    const likedVideos = await Like.aggregate([
      {
        $match: { video: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likedVideos",
        },
      },
      {
        $addFields: {
          likedVideosCount: {
            $size: "$likedVideos",
          },
        },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          email: 1,
          likedVideos: 1,
          likedVideosCount: 1,
        },
      },
    ]);

    if (!likedVideos) throw new ApiError(400, "Unable to get Liked Videos");

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
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while fetching Liked Videos"
    );
  }
};

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
