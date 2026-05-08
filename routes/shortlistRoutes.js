import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  toggleShortlist,
  getShortlisted,
} from "../controllers/shortlistController.js";

const router = express.Router();

router.post("/toggle", protect, toggleShortlist);
router.get("/", protect, getShortlisted);

export default router;
