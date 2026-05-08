import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMyViewers } from "../controllers/viewController.js";
const router = express.Router();
router.get("/viewers", protect, getMyViewers);
export default router;
