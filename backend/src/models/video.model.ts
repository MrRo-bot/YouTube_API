import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, //cloudinary video file url
      required: [true, "Video file is required"],
    },
    thumbnail: {
      type: String, //cloudinary video thumbnail url
      required: [true, "Video thumbnail is required"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "Video title is required"],
    },
    description: {
      type: String,
      required: [true, "Video duration is required"],
    },
    duration: {
      type: Number, //from cloudinary video file data
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

//plugin to use mongoose aggregate pipeline method for doing pagination operations in database together
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
