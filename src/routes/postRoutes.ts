import { Router } from "express";
import upload from "../middlewares/multer";
import {
  createPost,
  getPost,
  deletePost,
  updatePost,
  getFeed,
} from "../controllers/postController";
import { protect } from "../middlewares/authMiddleware";

const router = Router({ mergeParams: true });

router.use(protect);

// All routes below will be protected
router
  .route("/")
  .post(
    upload.fields([
      { name: "images", maxCount: 50 },
      { name: "videos", maxCount: 10 },
    ]),
    createPost
  )
  .get(getFeed);
router
  .route("/:id")
  .get(getPost)
  .delete(deletePost)
  .patch(
    upload.fields([
      { name: "images", maxCount: 50 },
      { name: "videos", maxCount: 10 },
    ]),
    updatePost
  );

export default router;
