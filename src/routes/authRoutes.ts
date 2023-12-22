import { Router } from "express";
import passport from "passport";
import {
  signUp,
  login,
  logout,
  refreshToken,
  forgetPassword,
  resetPassword,
  updatePassword,
} from "../controllers/authController";
import { protect } from "../middleware/authMiddlewares";
import { responseAndTokens } from "../utils/authHelperFunctions";

const router = Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/forget-password", forgetPassword);
router.post("/reset-password/:resetToken", resetPassword);

//Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get("/google/callback", passport.authenticate("google"), (req, res) => {
  responseAndTokens(req.user, res, 200);
});

//Protected routes
router.use(protect);

router.post("/logout", logout);
router.patch("/update-password", updatePassword);

export default router;
