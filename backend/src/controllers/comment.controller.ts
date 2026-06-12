import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const getVideoComments = async (req: any, res: any) => {
  //getting all comments of a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Valid Video ID is required");
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    };

    const aggregate = Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "video",
          as: "comments",
        },
      },
      {
        $project: {
          owner: 1,
          video: 1,
          content: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    const result = await Comment.aggregatePaginate(aggregate, options);

    res.status(200).json(
      new ApiResponse(200, true, "Paginated Comments", {
        data: result.docs,
        pagination: {
          totalComments: result.totalDocs,
          limit: result.limit,
          page: result.page,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          nextPage: result.nextPage,
          prevPage: result.prevPage,
        },
      })
    );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while getting Video Comments"
    );
  }
};

const addComment = async (req: any, res: any) => {
  //adding a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  const userId = req?.user.id;

  try {
    if (!isValidObjectId(videoId) || !isValidObjectId(userId))
      throw new ApiError(400, "Please provide valid ID's");

    const comment = await Comment.create({
      content,
      video: videoId,
      owner: userId,
    });

    if (!comment) throw new ApiError(400, "Unable to add Comment");

    return res
      .status(201)
      .json(new ApiResponse(201, true, "Comment added successfully", comment));
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while creating the Comment"
    );
  }
};

const updateComment = async (req: any, res: any) => {
  //updating a comment
  const { commentId } = req.params;
  const { content } = req.body;

  try {
    if (!commentId && !content)
      throw new ApiError(400, "Please provide valid details");

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $set: { content },
      },
      {
        returnDocument: "after",
        runValidators: true,
        timestamps: true,
      }
    );

    if (!updatedComment) throw new ApiError(400, "Unable to update Comment");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Comment updated successfully",
          updatedComment
        )
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while updating the Comment"
    );
  }
};

const deleteComment = async (req: any, res: any) => {
  //deleting a comment
  const { commentId } = req.params;

  try {
    const comment = await Comment.findByIdAndDelete(commentId);

    if (!comment) throw new ApiError(404, "Comment not found");

    res.status(204).json(new ApiResponse(204, true, "Comment Deleted!", {}));
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while deleting the Comment"
    );
  }
};

export { getVideoComments, addComment, updateComment, deleteComment };
