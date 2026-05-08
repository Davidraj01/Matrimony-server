import express from "express";
import {
  sendInterest,
  getReceivedInterests,
  getSentInterests,
  respondInterest,
} from "../controllers/interestController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Send interest
router.post("/send", protect, sendInterest);

// ✅ Received interests
router.get("/received", protect, getReceivedInterests);

// ✅ Sent interests
router.get("/sent", protect, getSentInterests);

// ✅ Accept / Reject
router.put("/:id/respond", protect, respondInterest);

export default router;
