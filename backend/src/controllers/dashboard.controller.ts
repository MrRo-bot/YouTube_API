import mongoose, { Schema } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const getChannelStats = async (req: any, res: any) => {
  //todo: VERIFY total subs, total videos, total likes, total views
  try {
    const stats = await User.aggregate([
      {
        $match: { _id: req.user?._id },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "owner",
          as: "videos",
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "likedBy",
          as: "likes",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          videosCount: {
            $size: "$videos",
          },
          likesCount: {
            $size: "$likes",
          },
        },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          avatar: 1,
          coverImage: 1,
          subscribers: 1,
          videos: 1,
          likes: 1,
          createdAt: 1,
        },
      },
    ]);

    if (!stats) throw new ApiError(404, "Channel stats not found");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Channel Stats fetched successfully",
          stats[0]
        )
      );
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while getting Stats"
    );
  }
};

const getChannelVideos = async (req: any, res: any) => {
  // TODO: VERIFY Get all the videos uploaded by the channel
  try {
    const videos = await User.aggregate([
      {
        $match: { _id: req.user?._id },
      },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "owner",
          as: "videos",
        },
      },
      {
        $addFields: {
          videosCount: {
            $size: "$videos",
          },
        },
      },
      {
        $project: {
          username: 1,
          videos: 1,
          videosCount: 1,
        },
      },
    ]);

    if (!videos) throw new ApiError(404, "Videos list not found");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Videos list fetched successfully",
          videos[0]
        )
      );
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while getting Videos list"
    );
  }
};

export { getChannelStats, getChannelVideos };
