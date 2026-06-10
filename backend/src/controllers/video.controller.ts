import mongoose, { isValidObjectId } from "mongoose";
import type { ObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = async (req: any, res: any) => {
  //TODO: VERIFY need to check everything here
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  try {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Valid userId is required");
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
        $addFields: {
          videosCount: {
            $size: "$videos",
          },
        },
      },
      {
        $project: {
          owner: 1,
          title: 1,
          description: 1,
          thumbnail: 1,
          videoFile: 1,
          videosCount: 1,
          duration: 1,
          views: 1,
          createdAt: 1,
        },
      },
    ]);

    const result = await Video.aggregatePaginate(aggregate, options);

    res.status(200).json(
      new ApiResponse(200, true, "Paginated Videos", {
        data: result.docs,
        pagination: {
          totalDocs: result.totalDocs,
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
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while getting Videos"
    );
  }
};

const publishAVideo = async (req: any, res: any) => {
  //TODO: VERIFY get video, upload to cloudinary, create video
  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.thumbnail?.[0]?.path;
  const videoFileLocalPath = req.file?.videoFile?.[0]?.path;

  try {
    const updates: {
      title?: string;
      description?: string;
      thumbnail?: string;
      videoFile?: string;
      duration?: number;
      views?: number;
      isPublished?: boolean;
      owner?: ObjectId;
    } = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    const thumbnailRes = await uploadOnCloudinary(thumbnailLocalPath);
    if (thumbnailRes !== null && thumbnailRes !== undefined)
      updates.thumbnail = thumbnailRes.url;
    const videoFileRes = await uploadOnCloudinary(videoFileLocalPath);
    if (videoFileRes !== null && videoFileRes !== undefined) {
      updates.videoFile = videoFileRes.url;
      updates.duration = videoFileRes.duration;
    }

    if (Object.keys(updates).length < 4)
      throw new ApiError(400, "Please provide valid data to upload Video");

    updates.views = 0;
    updates.isPublished = true;
    updates.owner = req.user?._id;

    const newVideo = await Video.create(updates);

    if (!newVideo) throw new ApiError(400, "Unable to published Video");

    return res
      .status(201)
      .json(
        new ApiResponse(201, true, "Video published successfully", newVideo)
      );
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while publishing the Video"
    );
  }
};

const getVideoById = async (req: any, res: any) => {
  const { videoId } = req.params;
  //TODO: VERIFY get video by id

  try {
    const video = await Video.findById(videoId);

    if (!video) throw new ApiError(404, "Video not found");

    res.status(200).json(new ApiResponse(200, true, "Video found!", video));
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while finding the Video"
    );
  }
};

const updateVideo = async (req: any, res: any) => {
  //TODO: VERIFY update video details like title, description, thumbnail
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.thumbnail?.[0]?.path;

  try {
    const updates: {
      title?: string;
      description?: string;
      thumbnail?: string;
    } = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    const thumbnailRes = await uploadOnCloudinary(thumbnailLocalPath);
    if (thumbnailRes !== null && thumbnailRes !== undefined)
      updates.thumbnail = thumbnailRes.url;

    if (Object.keys(updates).length < 1)
      throw new ApiError(400, "Please provide valid field data to update");

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: updates,
      },
      {
        returnDocument: "after",
        runValidators: true,
        timestamps: true,
      }
    );

    if (!updatedVideo) throw new ApiError(400, "Unable to update Video data");

    return res
      .status(200)
      .json(
        new ApiResponse(200, true, "Video updated successfully", updatedVideo)
      );
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while updating the Video data"
    );
  }
};

const deleteVideo = async (req: any, res: any) => {
  const { videoId } = req.params;
  //TODO: VERIFY delete video

  try {
    const video = await Video.findByIdAndDelete(videoId);

    if (!video) throw new ApiError(404, "Video not found");

    const deleteVideoRes = await deleteFromCloudinary(video?._id);
    if (!deleteVideoRes)
      throw new ApiError(400, "Error while deleting Video from Cloudinary");

    res.status(204).json(new ApiResponse(204, true, "Video Deleted!", {}));
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while deleting the Video"
    );
  }
};

const togglePublishStatus = async (req: any, res: any) => {
  const { videoId } = req.params;

  try {
    const video = await Video.findByIdAndUpdate(
      videoId,
      [
        {
          $set: { isPublisted: { $not: "$isPublished" } }, // {$not: "$"} toggles boolean field
        },
      ],
      {
        returnDocument: "after", //sending updated object
        timestamps: true, //updates updatedAt field
      }
    );

    if (!video) throw new ApiError(404, "Video not found");

    res
      .status(200)
      .json(new ApiResponse(200, true, "Video publish status updated!", video));
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while deleting the Video"
    );
  }
};

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
