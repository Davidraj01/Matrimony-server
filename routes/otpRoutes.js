import express from "express";
import { sendOTP, verifyOTP } from "../controllers/otpController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ MUST be protected (user already logged in)
router.post("/send", protect, sendOTP);
router.post("/verify", protect, verifyOTP);

export default router;
