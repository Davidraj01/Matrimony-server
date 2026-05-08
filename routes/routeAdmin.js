// routes/routeAdmin.js
import express from "express";
import {
  fetchAllUsers,
  disableUser,
  enableUser,
  fetchUserFull,
  fetchBilling,
  fetchDashboard,
} from "../controllers/controlAdmin.js";

import { protect } from "../middleware/authMiddleware.js";
import { checkAdmin } from "../middleware/checkAdmin.js";

const router = express.Router();

router.get("/users", protect, checkAdmin, fetchAllUsers);
router.put("/block/:id", protect, checkAdmin, disableUser);
router.put("/unblock/:id", protect, checkAdmin, enableUser);
router.get("/user/:id", protect, checkAdmin, fetchUserFull);

router.get("/billing", protect, checkAdmin, fetchBilling);
router.get("/dashboard", protect, checkAdmin, fetchDashboard);

export default router;
