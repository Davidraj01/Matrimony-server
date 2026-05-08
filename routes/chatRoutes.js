import express from "express";
import { getMessages } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";
import { checkPremium } from "../middleware/premiumMiddleware.js";
const router = express.Router();

router.get("/:userId", protect, checkPremium, getMessages);

export default router;
