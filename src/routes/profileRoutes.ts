import { Router } from "express";
import {
  getProfile,
  updateProfile,
  deleteProfile,
  followProfile,
  unfollowProfile,
  searchProfiles,
} from "../controllers/profileController";
import { protect } from "../middlewares/authMiddleware";
import upload from "../middlewares/multer";

const router = Router();

router.use(protect);

router.patch("/delete-profile", deleteProfile);
router.get("/get-profile", getProfile);
router.patch("/update-profile", upload.single("profilePicture"), updateProfile);
router.patch("/follow-profile/:id", followProfile);
router.patch("/unfollow-profile/:id", unfollowProfile);
router.get("/search-profiles", searchProfiles);

export default router;
