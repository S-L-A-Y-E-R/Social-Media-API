import { Router } from "express";
import {
  createConversation,
  getConversation,
} from "../controllers/conversationController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

router.use(protect);

router.route("/").post(createConversation);
router.route("/:profileTwoId").get(getConversation);

export default router;
