import { Router } from "express";
import {
  getProfile,
  updateProfile,
  deleteProfile,
  followProfile,
  unfollowProfile,
  searchProfiles,
  subscribeToNotifications,
  blockProfile,
  unblockProfile,
} from "../controllers/profileController";
import { getPostsForProfile, sharePost } from "../controllers/postController";
import { protect } from "../middlewares/authMiddleware";
import upload from "../middlewares/multer";
import postRouter from "./postRoutes";

const router = Router();

// Mounting the postRouter on the profileRouter
router.use("/:profileId/posts", postRouter);

router.use(protect);

// All routes below will be protected
router.patch("/delete-profile", deleteProfile);
router.get("/get-profile", getProfile);
router.patch("/update-profile", upload.single("profilePicture"), updateProfile);
router.patch("/follow-profile/:id", followProfile);
router.patch("/unfollow-profile/:id", unfollowProfile);
router.get("/search-profiles", searchProfiles);
router.post("/subscribe-to-notifications", subscribeToNotifications);
router.get("/:profileId/posts", getPostsForProfile);
router.post("/:profileId/share-post/:postId", sharePost);
router.patch("/:id/block", blockProfile);
router.patch("/:id/unblock", unblockProfile);

export default router;
