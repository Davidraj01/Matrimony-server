import express from "express";
import {
  getPlans,
  getMyPlan,
  upgradePlan,
} from "../controllers/planController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getPlans);
router.get("/me", protect, getMyPlan);
router.post("/upgrade", protect, upgradePlan);

export default router;
