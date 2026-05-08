import express from "express";
import {
  getProfile,
  updateProfile,
  uploadPhotos,
  deletePhoto,
  setProfilePic,
  viewProfile,
  getProfileById,
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();
router.get("/me", protect, getProfile);
router.get("/:id", protect, getProfileById);
router.put("/", protect, updateProfile);

router.post("/upload", protect, upload.array("photos", 6), uploadPhotos);

router.delete("/photo", protect, deletePhoto);
router.put("/profile-pic", protect, setProfilePic);
router.post("/view", protect, viewProfile);

export default router;
