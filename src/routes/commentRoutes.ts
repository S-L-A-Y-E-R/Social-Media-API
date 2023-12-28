import { Router } from "express";
import {
  addComment,
  updateComment,
  getPostComments,
  addReplyToComment,
} from "../controllers/commentController";
import { protect } from "../middlewares/authMiddleware";
import upload from "../middlewares/multer";

const router = Router();

router.use(protect);

//All routes below will use the protect middleware
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  addComment
);
router.patch(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  updateComment
);
router.post(
  "/:parentId/reply",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  addReplyToComment
);
router.get("/post-comments/:postId", getPostComments);

export default router;
