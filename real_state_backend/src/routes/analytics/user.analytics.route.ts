import express from "express";
import { authMiddleware } from "../../middleware/auth";
import { getUserAnalytics } from "../../controllers/analytics/user.analytics";
import { requireAdminOrSuperAdmin } from "../../middleware/staff";

const router = express.Router();

// Route to get user analytics summary
router.get("/user", authMiddleware,requireAdminOrSuperAdmin,getUserAnalytics);

export default router;