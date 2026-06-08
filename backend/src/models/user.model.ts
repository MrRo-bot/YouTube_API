import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import config from "../config/config.js";

const userSchema = new Schema(
  {
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    username: {
      type: String,
      required: [true, "Username is required"],
      lowercase: true,
      trim: true,
      unique: true,
      index: true, //using index carefully to specific fields
    },
    email: {
      type: String,
      required: [true, "E-mail is required"],
      lowercase: true,
      trim: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      required: [true, "Avatar image is required"], //cloudinary web url for image links
    },
    coverImage: {
      type: String, //cloudinary web url for image links
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

//encrypting password using bcrypt before its saved in DB
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

//comparing password to identify if given password is correct (custom method for schema)
userSchema.methods.isPasswordValid = async function (
  password: string | Buffer<ArrayBufferLike>
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

//using access token and refresh token for JWT authentication (custom methods)
userSchema.methods.generateAccessToken = function (): string {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    config.access_token,
    { expiresIn: config.accessExpiry }
  );
};

userSchema.methods.generateRefreshToken = function (): string {
  return jwt.sign({ _id: this._id }, config.refresh_token, {
    expiresIn: config.refreshExpiry,
  });
};

export const User = mongoose.model("User", userSchema);
