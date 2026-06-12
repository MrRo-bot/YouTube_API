import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const createTweet = async (req: any, res: any) => {
  //creating tweet
  const { content } = req.body;
  const owner = req.user?._id;

  try {
    if (!content || !isValidObjectId(owner))
      throw new ApiError(400, "Please provide valid details");

    const tweet = await Tweet.create({
      content,
      owner,
    });

    if (!tweet) throw new ApiError(400, "Unable to add Tweet");

    return res
      .status(201)
      .json(new ApiResponse(201, true, "Tweet published successfully", tweet));
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while creating the Tweet"
    );
  }
};

const getUserTweets = async (req: any, res: any) => {
  //getting user tweets

  try {
    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(404, "User ID not found");

    const userTweets = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.user?._id) },
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
          tweetsCount: {
            $size: "$tweets",
          },
        },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          email: 1,
          tweets: 1,
          tweetsCount: 1,
        },
      },
    ]);

    if (!userTweets) throw new ApiError(404, "User Tweets not found");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "User's Tweets fetched successfully",
          userTweets
        )
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while fetching User Tweets"
    );
  }
};

const updateTweet = async (req: any, res: any) => {
  //updating tweet
  const { tweetId } = req.params;
  const { content } = req.body;

  try {
    if (!tweetId || !content)
      throw new ApiError(400, "Please provide valid details");

    const updatedTweet = await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $set: { content },
      },
      {
        returnDocument: "after",
        runValidators: true,
        timestamps: true,
      }
    );

    if (!updatedTweet) throw new ApiError(400, "Unable to update Tweet");

    return res
      .status(200)
      .json(
        new ApiResponse(200, true, "Tweet updated successfully", updatedTweet)
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while updating the Tweet"
    );
  }
};

const deleteTweet = async (req: any, res: any) => {
  //deleting tweet
  const { tweetId } = req.params;

  try {
    const tweet = await Tweet.findByIdAndDelete(tweetId);

    if (!tweet) throw new ApiError(404, "Tweet not found");

    res.status(204).json(new ApiResponse(204, true, "Tweet Deleted!", {}));
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while deleting the Tweet"
    );
  }
};

export { createTweet, getUserTweets, updateTweet, deleteTweet };
