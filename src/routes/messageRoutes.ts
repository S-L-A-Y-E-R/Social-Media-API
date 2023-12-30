import { Router } from "express";
import {
  sendMessage,
  updateMessage,
  deleteMessage,
  getMessages,
} from "../controllers/messagesController";
import { protect } from "../middlewares/authMiddleware";

const router = Router();

router.use(protect);

router.route("/").post(sendMessage);
router.route("/:id/update").patch(updateMessage);
router.route("/:id/delete").delete(deleteMessage);
router.route("/:conversationId").get(getMessages);

export default router;
