import { Router } from "express";
import {
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
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  //custom multer middleware
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);

//secured routes
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/c/:username").get(verifyJWT, getChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);

//patch instead of post
router.route("/update-profile").patch(verifyJWT, updateProfileDetails);
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvatar);
router
  .route("/update-cover")
  .patch(verifyJWT, upload.single("coverImage"), updateCover);

router.route("/refresh-token").post(refreshAccessToken);
router.route("/reset-password").post(verifyJWT, resetPassword);
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
