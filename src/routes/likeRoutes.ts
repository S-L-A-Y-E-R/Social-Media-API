import { Router } from "express";
import {
  likePost,
  likeComment,
  unlikeComment,
  unlikePost,
} from "../controllers/likeContoller";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

router.use(protect);

router.post("/post", likePost).post("/comment", likeComment);
router.delete("/:id/post", unlikePost).delete("/:id/comment", unlikeComment);

export default router;
