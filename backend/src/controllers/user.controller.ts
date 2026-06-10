import { type ObjectId, Types } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import config from "../config/config.js";
import { cookieOptions } from "../constants.js";

const generateAccessTokenAndRefreshToken = async (userId: ObjectId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while generating tokens"
    );
  }
};

/*
 * REGISTERING NEW USER

 * Getting fields from request body
 * Simple empty validation check (Zod for advanced checks)
 * Finding if username or email exists in database
 * Using middlewares and utility function, getting images and uploading in cloudinary
 * Creating new user object and pushing it to MongoDB
 * Stripping sensitive field and send error if user wasn't created
 * sending response with new user object to frontend
 */

const registerUser = async (req: any, res: any) => {
  const { fullName, email, username, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(409, "All necessary fields are required");
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      throw new ApiError(400, "User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Please provide an Avatar image");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar) {
      throw new ApiError(400, "Please provide an Avatar image");
    }

    let coverImageLocalPath = "";
    if (
      Array.isArray(req.files?.coverImage) &&
      req.files.coverImage.length > 0
    ) {
      coverImageLocalPath = req.files?.coverImage?.[0]?.path ?? "";
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    const userObject = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url ?? "",
      email,
      password, //will be hased because used middleware in user.model.ts
      username: username.toLowerCase(),
    });

    const user = await User.findById(userObject._id).select(
      "-password -refreshToken" //this means exclude these two fields, weird syntax but ok
    );
    if (!user) {
      throw new ApiError(
        500,
        "Something went wrong while registering new user"
      );
    } else {
      console.log("User registered successfully");
    }

    return res
      .status(201)
      .json(new ApiResponse(201, true, "User registered successfully", user));
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while registering new user"
    );
  }
};

/*
 * LOGGING IN EXISTING USER

 * Getting fields from request body
 * Simple empty validation check (Zod for advanced checks)
 * Finding if username or email exists in database
 * checking if password matches
 * Generating access and refresh token using helper function
 * sending it to frontend inside secure .cookie() middleware, also send with response object as well for maybe mobile apps or frontend want to store in localstorage for any reason
 */

const loginUser = async (req: any, res: any) => {
  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "Username or Email is required");
  }

  try {
    const user = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!password) throw new ApiError(400, "Password is required");

    const isPasswordValid = await user.isPasswordValid(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(200, true, "Logged in successfully", {
          user: loggedInUser,
          accessToken,
          refreshToken,
        })
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while performing login"
    );
  }
};

/*
 * LOGGING OUT EXISTING USER

 * Getting id from request payload thanks to auth middleware
 * finding user by id and removing refresh token
 * saving user data with updated values
 * sending response while clearing both cookies access and refresh token from user
 */
const logoutUser = async (req: any, res: any) => {
  const { _id } = req.user;

  try {
    await User.findByIdAndUpdate(
      _id,
      {
        $unset: {
          refreshToken: 1, //instead of $set {refreshToken:undefined}
        },
      },
      {
        //to get updated value in return otherwise refreshToken will be passed without being undefined
        returnDocument: "after",
      }
    );

    return res
      .status(204)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json(new ApiResponse(204, true, "User logged out successfully", {}));
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while performing logout"
    );
  }
};

/*
 * REFRESHING TOKENS

 * getting token provided from user body or available in cookie
 * checking if refresh token is provided or not
 * decoding token and getting user data
 * checking if token provided by user matches with token stored in db
 * generating new access and refresh token
 * sending refreshed tokens with response body
 */
const refreshAccessToken = async (req: any, res: any) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken: any | JwtPayload = jwt.verify(
      incomingRefreshToken,
      config.refresh_token
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) throw new ApiError(400, "Invalid Refresh token");

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(403, "Refresh token is expired or used");
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user?._id);

    return res
      .status(200)
      .cookie("accessToken", newAccessToken)
      .cookie("refreshToken", newRefreshToken)
      .json(
        new ApiResponse(200, true, "Access token refreshed", {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        })
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Something went wrong while refreshing the token"
    );
  }
};

/*
 * CHANGING PASSWORD

 * because we verified user using jwt we have user object in request, use it to get user id
 * find old password from request body and cross check it with existing password
 * if password matches, set new password to db (hashes itself because schema.pre())
 * send response 
 */

const resetPassword = async (req: any, res: any) => {
  const { oldPassword, newPassword } = req?.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(
      401,
      `Please provide ${!oldPassword ? "Old password" : "New password"} to continue`
    );
  }

  try {
    const user = await User.findById(req.user?._id);

    const isPasswordValid = await user.isPasswordValid(oldPassword);
    if (!isPasswordValid) {
      throw new ApiError(400, "Existing password doesn't match");
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
      .status(204)
      .json(new ApiResponse(204, true, "Password changed successfully", {}));
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while resetting the password"
    );
  }
};

/*
 * GETTING CURRENT USER

 * verifying existing user using auth middleware
 * send response with user object
 */

const getCurrentUser = async (req: any, res: any) => {
  try {
    return res.status(200).json(new ApiResponse(200, true, "", req?.user));
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while getting current user"
    );
  }
};

/*
 * UPDATING EDITABLE PROFILE DETAILS

 * getting updated values from req body if exists
 * checking if values are actually provided or not
 * find what fiels are provided for change
 * find if user is authorized to update the fields using auth middleware
 * update fields with db and save
 * send response with changes
 */

const updateProfileDetails = async (req: any, res: any) => {
  const { fullName, email } = req.body;

  const updates: { fullName?: string; email?: string } = {};

  if (typeof fullName !== "undefined") updates.fullName = fullName;
  if (typeof email !== "undefined") updates.email = email;

  if (Object.keys(updates).length < 1)
    throw new ApiError(400, "Please provide valid field data to update");

  try {
    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(401, "Unauthorized update");

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: updates,
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    ).select("-password");

    if (!updatedUser) throw new ApiError(400, "Unable to update user data");

    return res
      .status(200)
      .json(
        new ApiResponse(200, true, "User updated successfully", updatedUser)
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while updating the fields"
    );
  }
};

/*
 * UPDATING THE AVATAR IMAGE

 * finding local file path using multer middleware
 * uploading avatar image to cloudinary
 * verifying existing user using auth middleware
 * for saving cost, deleting old image from cloudinary
 * updating the image to user object
 * sending response with updated user data
 */

const updateAvatar = async (req: any, res: any) => {
  const avatar = req.file;

  if (!avatar) throw new ApiError(400, "Please provide an Avatar image");

  try {
    let avatarLocalPath = req.file.path;

    const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarResponse) {
      throw new ApiError(
        400,
        "Please provide a valid link for an Avatar image"
      );
    }

    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(401, "Unauthorized update");

    if (user.avatar) {
      const deletePrevAvatarResponse = await deleteFromCloudinary(user.avatar);
      if (!deletePrevAvatarResponse)
        throw new ApiError(
          400,
          "Error while deleting previous avatar image from cloudinary"
        );
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          avatar: avatarResponse.url,
        },
      },
      {
        returnDocument: "after",
      }
    ).select("-password");
    if (!updatedUser)
      throw new ApiError(400, "Unable to update an Avatar image");

    return res
      .status(200)
      .json(
        new ApiResponse(200, true, "Avatar updated successfully", updatedUser)
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while updating the avatar image"
    );
  }
};

/*
 * UPDATING THE COVER IMAGE

 * finding local file path using multer middleware
 * uploading cover image to cloudinary
 * verifying existing user using auth middleware
 * for saving cost removing old image from cloudinary
 * updating the image to user object
 * sending response with updated user data
 */

const updateCover = async (req: any, res: any) => {
  const coverImage = req.file;

  if (!coverImage) throw new ApiError(400, "Please provide a Cover image");

  try {
    let coverImageLocalPath = req.file.path;

    const coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImageResponse) {
      throw new ApiError(400, "Please provide a valid link for Cover image");
    }

    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(401, "Unauthorized update");

    if (user.coverImage) {
      const deletePrevCoverResponse = await deleteFromCloudinary(
        user?.coverImage
      );
      if (!deletePrevCoverResponse)
        throw new ApiError(
          400,
          "Error while deleting previous cover image from cloudinary"
        );
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          coverImage: coverImageResponse.url,
        },
      },
      {
        returnDocument: "after",
      }
    ).select("-password");
    if (!updatedUser) throw new ApiError(400, "Unable to update Cover image");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Cover image updated successfully",
          updatedUser
        )
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while updating the Cover image"
    );
  }
};

/*
 * GETTING CHANNEL PROFILE

 * finding username from request params
 * creating aggregation pipeline and saving output in channel
 * if channel exists send response with channel init
 */

const getChannelProfile = async (req: any, res: any) => {
  const { username } = req.params;

  if (!username?.trim()) throw new ApiError(400, "Username is missing");

  try {
    const channel = await User.aggregate([
      //finding user with username
      {
        //added lowercase safety just in case
        $match: { username: username?.toLowerCase() },
      },
      //finding list of subscribers by getting users that are subscribed to user channel
      {
        $lookup: {
          //lowercase and plural
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      //finding list of channels user subscribed to by getting used id associated with channels
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      //adding new fields in user model pipeline for additional info needed by channel profile
      {
        $addFields: {
          subscribersCount: {
            //size operator for finding user subs count
            $size: "$subscribers",
          },
          channelSubscribedTo: {
            //size operator for getting count of channels user subbed to
            $size: "$subscribedTo",
          },
          //finding subscribed or not
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscribers.subscriber"] },
              then: true,
              else: false,
            },
          },
        },
      },
      //sending only required fields for channel profile
      {
        $project: {
          fullName: 1,
          username: 1,
          avatar: 1,
          coverImage: 1,
          subscribers: 1,
          subscribedTo: 1,
          email: 1,
          createdAt: 1,
        },
      },
    ]);

    if (!channel?.length) throw new ApiError(404, "Channel does not exist");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Channel profile fetched successfully",
          channel[0]
        )
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while getting Channel info"
    );
  }
};

/*
 * GETTING WATCH HISTORY

 * creating aggregation pipeline for getting watch history with nested pipelines/sub pipelines
 * if user exists send response with only watch history field
 */

const getWatchHistory = async (req: any, res: any) => {
  try {
    const user = await User.aggregate([
      {
        $match: { _id: new Types.ObjectId(req.user?._id) },
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  //or making it separate pipeline after $lookup
                  {
                    $project: {
                      username: 1,
                      fullName: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            // {
            //   $project: {
            //     username: 1,
            //     fullName: 1,
            //     avatar: 1,
            //   },
            // },
            {
              //for getting object out of array
              $addFields: {
                owner: { $first: "$owner" },
              },
            },
          ],
        },
      },
    ]);

    if (!user) throw new ApiError(404, "Watch history not found");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Watch history fetched successfully",
          user[0].watchHistory
        )
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while getting watch history"
    );
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  resetPassword,
  getCurrentUser,
  updateProfileDetails,
  updateAvatar,
  updateCover,
  getChannelProfile,
  getWatchHistory,
};
