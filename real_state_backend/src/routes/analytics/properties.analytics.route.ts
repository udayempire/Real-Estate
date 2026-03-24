import express from "express";
import { authMiddleware } from "../../middleware/auth";
import { requireAdminOrSuperAdmin } from "../../middleware/staff";
import { getPropertiesAnalytics } from "../../controllers/analytics/properties.analytics";

const router = express.Router();

router.get("/properties", authMiddleware, requireAdminOrSuperAdmin, getPropertiesAnalytics);

export default router;
