import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.model.js";

const getChannelStats = async (req: any, res: any) => {
  //getting total subs, total videos, total likes, total tweets, total views
  const userId = req.user?._id;

  try {
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid User ID");

    const stats = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) },
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
        $lookup: {
          from: "tweets",
          localField: "_id",
          foreignField: "owner",
          as: "tweets",
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
          tweetsCount: {
            $size: "$tweets",
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
          subscribersCount: 1,
          videos: 1,
          videosCount: 1,
          likes: 1,
          likesCount: 1,
          tweets: 1,
          tweetsCount: 1,
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
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while getting Stats"
    );
  }
};

const getChannelVideos = async (req: any, res: any) => {
  //getting all videos with pagination using queries below
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  const userId = req.user?._id;

  try {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid User ID");
    }

    const sort: { [key: string]: number } = {};
    const validSortFields = [
      "createdAt",
      "title",
      "views",
      "duration",
      "updatedAt",
    ];

    if (validSortFields.includes(sortBy)) {
      sort[sortBy] = sortType === "asc" ? 1 : -1;
    } else {
      sort["createdAt"] = -1;
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: sort,
    };

    const aggregate = Video.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
          ...(query &&
            query.trim() !== "" && {
              $or: [{ title: { $regex: query.trim(), $options: "i" } }],
            }),
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
        $project: {
          owner: 1,
          title: 1,
          description: 1,
          thumbnail: 1,
          videoFile: 1,
          duration: 1,
          views: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    const result = await Video.aggregatePaginate(aggregate, options);

    res.status(200).json(
      new ApiResponse(200, true, "Paginated Videos", {
        data: result.docs,
        pagination: {
          totalVideos: result.totalDocs,
          limit: result.limit,
          page: result.page,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          nextPage: result.nextPage,
          prevPage: result.prevPage,
        },
        filters: { query, sortBy, sortType },
      })
    );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while getting Videos"
    );
  }
};

export { getChannelStats, getChannelVideos };
