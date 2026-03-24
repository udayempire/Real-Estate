import express from "express";
import { authMiddleware } from "../../middleware/auth";
import { getUserAnalytics } from "../../controllers/analytics/user.analytics";

const router = express.Router();

// Route to get user analytics summary
router.get("/user", authMiddleware, getUserAnalytics);

export default router;