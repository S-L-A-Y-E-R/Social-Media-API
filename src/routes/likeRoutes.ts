import { Router } from "express";
import {
  likePost,
  likeComment,
  unlikeComment,
  unlikePost,
} from "../controllers/likeContoller";

const router = Router();

router.post("/like-post", likePost).post("/like-comment", likeComment);
router
  .delete("/unlike-post/:id", unlikePost)
  .delete("/unlike-comment/:id", unlikeComment);

export default router;
