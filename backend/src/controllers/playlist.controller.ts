import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const createPlaylist = async (req: any, res: any) => {
  const { name, description } = req.body;
  //TODO: VERIFY create playlist

  if (!name && !description)
    throw new ApiError(400, "Please provide Playlist Name and Description");

  try {
    const newPlaylist = await Playlist.create({
      name,
      description,
      videos: [],
      owner: req.user?._id,
    });

    if (!newPlaylist) throw new ApiError(400, "Unable to create Playlist");

    return res
      .status(200)
      .json(new ApiResponse(200, true, "Playlist added", newPlaylist));
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while creating the Playlist"
    );
  }
};

const getUserPlaylists = async (req: any, res: any) => {
  const { userId } = req.params;
  //TODO: VERIFY get user playlists

  try {
    if (!isValidObjectId(userId)) throw new ApiError(404, "User ID not found");

    const userPlaylist = await User.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "playlists",
          localField: "_id",
          foreignField: "owner",
          as: "userPlaylists",
        },
      },
      {
        $addFields: {
          playlistsCount: {
            $size: "$userPlaylists",
          },
        },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          email: 1,
          userPlaylists: 1,
          playlistsCount: 1,
        },
      },
    ]);

    if (!userPlaylist) throw new ApiError(404, "User Playlists not found");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "User's Playlists fetched successfully",
          userPlaylist
        )
      );
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while fetching User Playlists"
    );
  }
};

const getPlaylistById = async (req: any, res: any) => {
  const { playlistId } = req.params;
  //TODO: VERIFY get playlist by id

  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid Playlist ID");

  try {
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) throw new ApiError(404, "Playlist not found");

    return res
      .status(200)
      .json(new ApiResponse(200, true, "Found the Playlist", playlist));
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while getting the Playlist"
    );
  }
};

const addVideoToPlaylist = async (req: any, res: any) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid IDs");

  try {
    const updatedPlaylist = await Playlist.updateOne(
      playlistId,
      { $addToSet: { videos: videoId } }, // $addToSet avoids duplicates
      {
        runValidators: true,
        timestamps: true,
      }
    );

    if (!updatedPlaylist)
      throw new ApiError(400, "Unable to add Video in Playlist");

    return res
      .status(200)
      .json(
        new ApiResponse(200, true, "Video added to Playlist", updatedPlaylist)
      );
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while adding video to the Playlist"
    );
  }
};

const removeVideoFromPlaylist = async (req: any, res: any) => {
  const { playlistId, videoId } = req.params;
  //TODO: VERIFY remove video from playlist

  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid IDs");

  try {
    const updatedPlaylist = await Playlist.updateOne(
      playlistId,
      { $pull: { videos: videoId } },
      {
        runValidators: true,
        timestamps: true,
      }
    );

    if (!updatedPlaylist)
      throw new ApiError(400, "Unable to remove Video in Playlist");

    return res
      .status(200)
      .json(
        new ApiResponse(200, true, "Video removed to Playlist", updatedPlaylist)
      );
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message ||
        "Something went wrong while removing video from the Playlist"
    );
  }
};

const deletePlaylist = async (req: any, res: any) => {
  const { playlistId } = req.params;
  //TODO: VERIFY delete playlist

  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid Playlist ID");

  try {
    await Playlist.findByIdAndDelete(playlistId);

    return res
      .status(204)
      .json(new ApiResponse(204, true, "Deleted the Playlist", {}));
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while deleting the Playlist"
    );
  }
};

const updatePlaylist = async (req: any, res: any) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: VERIFY update playlist

  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid Playlist ID");

  const updates: { name?: string; description?: string } = {};

  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;

  if (Object.keys(updates).length < 1)
    throw new ApiError(400, "No fields provided to update the Playlist");

  try {
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $set: updates,
      },
      {
        returnDocument: "after",
        runValidators: true,
        timestamps: true,
      }
    );

    if (!updatedPlaylist)
      throw new ApiError(400, "Unable to update the Playlist");

    return res
      .status(200)
      .json(new ApiResponse(200, true, "Playlist updated", updatedPlaylist));
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error.message || "Something went wrong while updating the Playlist"
    );
  }
};

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
