import jwt from "jsonwebtoken";

import { ApiError } from "../utils/apiError.js";
import config from "../config/config.js";
import { User } from "../models/user.model.js";

export const verifyJWT = async (req: any, _: any, next: () => void) => {
  try {
    //getting token from either headers or request that contains cookies because of our cookie parser middleware (covers both mobile and web browsers)
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization").replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    //decoding user data from token
    //todo: may need to create some types for each model I've created
    const decodedToken: any | string | jwt.JwtPayload = jwt.verify(
      token,
      config.access_token
    );

    //finding user and excluding some fields
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid Access token");
    }

    //sending user data in request payload
    req.user = user;

    next();
  } catch (error: any | { message: string }) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while verifying tokens"
    );
  }
};
