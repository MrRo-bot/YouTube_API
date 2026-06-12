import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const createPlaylist = async (req: any, res: any) => {
  //creating new blank playlist
  const { name, description } = req.body;
  const userId = req.user?._id;

  try {
    if (!name || !description)
      throw new ApiError(400, "Please provide Playlist Name and Description");
    const newPlaylist = await Playlist.create({
      name,
      description,
      videos: [],
      owner: userId,
    });

    if (!newPlaylist) throw new ApiError(400, "Unable to create Playlist");

    return res
      .status(200)
      .json(new ApiResponse(200, true, "Playlist added", newPlaylist));
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while creating the Playlist"
    );
  }
};

const getUserPlaylists = async (req: any, res: any) => {
  //getting users playlists
  const userId = req.user?._id;

  try {
    if (!userId) throw new ApiError(404, "User ID not found");

    const userPlaylist = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "playlists",
          let: { userId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$owner", "$$userId"] } } },
            // lookup video docs for the playlist's videos array
            {
              $lookup: {
                from: "videos",
                let: { videoIds: "$videos" },
                pipeline: [
                  { $match: { $expr: { $in: ["$_id", "$$videoIds"] } } },
                  {
                    $project: {
                      title: 1,
                      description: 1,
                      videoFile: 1,
                      thumbnail: 1,
                      duration: 1,
                      views: 1,
                      isPublished: 1,
                      updatedAt: 1,
                      createdAt: 1,
                    },
                  },
                ],
                as: "videoDocs",
              },
            },
            // reordering videoDocs to match the original videos array and to preserve duplicates
            {
              $addFields: {
                videos: {
                  $map: {
                    input: "$videos",
                    as: "vid",
                    in: {
                      $first: {
                        $filter: {
                          input: "$videoDocs",
                          cond: { $eq: ["$$this._id", "$$vid"] },
                        },
                      },
                    },
                  },
                },
              },
            },
            // remove the temporary videoDocs field
            { $project: { videoDocs: 0 } },
          ],
          as: "userPlaylists",
        },
      },
      {
        $addFields: { playlistCount: { $size: "$userPlaylists" } },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          email: 1,
          userPlaylists: 1,
          playlistCount: 1,
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
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while fetching User Playlists"
    );
  }
};

const getPlaylistById = async (req: any, res: any) => {
  //getting playlist by id
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid Playlist ID");

  try {
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) throw new ApiError(404, "Playlist not found");

    return res
      .status(200)
      .json(new ApiResponse(200, true, "Found the Playlist", playlist));
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while getting the Playlist"
    );
  }
};

const addVideoToPlaylist = async (req: any, res: any) => {
  //adding video to an existing playlist
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid IDs");

  try {
    const updatedPlaylist = await Playlist.updateOne(
      { _id: playlistId },
      { $addToSet: { videos: new mongoose.Types.ObjectId(videoId) } }, // $addToSet avoids duplicates
      {
        runValidators: true,
        timestamps: true,
      }
    );

    if (updatedPlaylist.matchedCount === 0) {
      throw new ApiError(404, "Playlist not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, true, "Video added to Playlist", updatedPlaylist)
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while adding video to the Playlist"
    );
  }
};

const removeVideoFromPlaylist = async (req: any, res: any) => {
  //removing video from a playlist if video exists
  const { playlistId, videoId } = req.params;

  try {
    if (!isValidObjectId(videoId) || !isValidObjectId(playlistId))
      throw new ApiError(400, "Invalid IDs");

    const updatedPlaylist = await Playlist.updateOne(
      { _id: playlistId },
      { $pull: { videos: new mongoose.Types.ObjectId(videoId) } },
      {
        runValidators: true,
        timestamps: true,
      }
    );

    if (updatedPlaylist.matchedCount === 0) {
      throw new ApiError(404, "Playlist not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, true, "Video removed to Playlist", updatedPlaylist)
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message ||
        "Something went wrong while removing video from the Playlist"
    );
  }
};

const deletePlaylist = async (req: any, res: any) => {
  //deleting playlist
  const { playlistId } = req.params;

  try {
    if (!isValidObjectId(playlistId))
      throw new ApiError(400, "Invalid Playlist ID");

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylist) throw new ApiError(404, "Playlist doesn't exist");
    return res
      .status(204)
      .json(new ApiResponse(204, true, "Deleted the Playlist", {}));
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while deleting the Playlist"
    );
  }
};

const updatePlaylist = async (req: any, res: any) => {
  //updating playlist information
  const { playlistId } = req.params;
  const { name, description } = req.body;

  try {
    if (!isValidObjectId(playlistId))
      throw new ApiError(400, "Invalid Playlist ID");

    const updates: { name?: string; description?: string } = {};

    if (name) updates.name = name;
    if (description) updates.description = description;

    if (Object.keys(updates).length < 1)
      throw new ApiError(400, "No fields provided to update the Playlist");

    const updatedPlaylist = await Playlist.findById(playlistId);

    if (!updatedPlaylist) throw new ApiError(404, "Playlist not found");

    if (updates.name) updatedPlaylist.name = updates.name;
    if (updates.description) updatedPlaylist.description = updates.description;

    await updatedPlaylist.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          true,
          "Playlist updated successfully",
          updatedPlaylist
        )
      );
  } catch (error: any | { statusCode?: number; message?: string }) {
    throw new ApiError(
      error.statusCode || 500,
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
