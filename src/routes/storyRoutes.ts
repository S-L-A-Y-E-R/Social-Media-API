import { Router } from "express";
import {
  addStrory,
  deleteStory,
  getStories,
} from "../controllers/stroryController";
import { protect } from "../middlewares/authMiddleware";
import upload from "../middlewares/multer";

const router = Router();

router.use(protect);

//Protected routes
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  addStrory
);
router.delete("/:id", deleteStory);
router.get("/:profileId", getStories);

export default router;
