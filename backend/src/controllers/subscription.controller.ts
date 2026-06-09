import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

// todo: VERIFY toggle subscription
const toggleSubscription = async (req: any, res: any) => {
  const { channelId } = req.params;

  try {
    await Subscription.findByIdAndDelete({ _id: channelId });

    return res.status(200).json({ message: "Subscription changed" });
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while toggling subscription"
    );
  }
};

//todo: VERIFY controller to return subscriber list of a channel
const getUserChannelSubscribers = async (req: any, res: any) => {
  const { channelId } = req.params;

  if (!channelId) throw new ApiError(400, "Invalid Channel ID");

  try {
    const subscribers = await User.aggregate([
      { $match: { _id: channelId } },
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
          username: 1,
          subscribers: 1,
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
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while getting subscribers"
    );
  }
};

//todo: VERIFY controller to return channel list to which user has subscribed
const getSubscribedChannels = async (req: any, res: any) => {
  const { subscriberId } = req.params;

  if (!subscriberId) throw new ApiError(400, "Invalid subscriber ID");

  try {
    const subscriptions = await User.aggregate([
      { $match: { _id: subscriberId } },
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
          username: 1,
          subscriptions: 1,
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
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while getting subscriptions"
    );
  }
};

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
