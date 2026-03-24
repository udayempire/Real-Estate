import express from "express";
import { authMiddleware } from "../../middleware/auth";
import { requireAdminOrSuperAdmin } from "../../middleware/staff";
import { getFinancialsAnalytics } from "../../controllers/analytics/financials.analytics";

const router = express.Router();

router.get("/financials", authMiddleware, requireAdminOrSuperAdmin, getFinancialsAnalytics);

export default router;
