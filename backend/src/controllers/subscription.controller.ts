import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose, { isValidObjectId, Types } from "mongoose";

const toggleSubscription = async (req: any, res: any) => {
  //toggle subscription
  const { channelId } = req.params;
  const userId = req.user?._id;

  try {
    if (!isValidObjectId(channelId))
      throw new ApiError(400, "Provide valid channel ID");

    if (req.user?._id.equals(channelId))
      throw new ApiError(400, "Channel and User ID is same");

    const existingSub = await Subscription.findOne({
      subscriber: userId,
      channel: channelId,
    });

    if (existingSub) {
      await Subscription.findByIdAndDelete(existingSub._id);

      return res.status(200).json(
        new ApiResponse(200, true, "Unsubscribed successfully", {
          isSubscribed: false,
        })
      );
    } else {
      // Subscribe
      await Subscription.create({
        subscriber: userId,
        channel: channelId,
      });

      return res.status(201).json(
        new ApiResponse(201, true, "Subscribed successfully", {
          isSubscribed: true,
        })
      );
    }
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while toggling subscription"
    );
  }
};

const getUserChannelSubscribers = async (req: any, res: any) => {
  //getting subscribers list of current channel
  try {
    const userId = req.user?._id;
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");

    const subscribers = await User.aggregate([
      { $match: { _id: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          avatar: 1,
          subscribers: 1,
          //todo: verify getting channel info from subs if needed
        },
      },
    ]);

    if (!subscribers?.length)
      throw new ApiError(404, "Unable to get subscribers");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Subscribers fetched successfully",
          subscribers[0]
        )
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while getting subscribers"
    );
  }
};

const getSubscribedChannels = async (req: any, res: any) => {
  //getting channel list to which current user has subscribed to
  try {
    const userId = req.user?._id;
    if (!isValidObjectId(userId))
      throw new ApiError(400, "Invalid subscriber ID");

    const subscriptions = await User.aggregate([
      { $match: { _id: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          subscriptions: 1,
          avatar: 1,
          //todo: verify subscribers and videos count calculation
        },
      },
    ]);

    if (!subscriptions?.length)
      throw new ApiError(404, "Unable to get subscriptions");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Subscriptions fetched successfully",
          subscriptions[0]
        )
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while getting subscriptions"
    );
  }
};

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
