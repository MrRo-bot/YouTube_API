import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const healthcheck = async (_: any, res: any) => {
  const data = {
    uptime: process.uptime(),
    message: "Ok",
    date: new Date(),
  };
  try {
    return res
      .status(200)
      .json(new ApiResponse(200, true, "Health check: ✅", data));
  } catch (error) {
    throw new ApiError(503, "Health check: ❌");
  }
};

export { healthcheck };
