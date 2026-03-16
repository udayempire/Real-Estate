import express from "express";
import {
    getPropertyRequirements,
    updateRequirementStatus,
} from "../../controllers/staff/requirement.staff.controller";
import { authMiddleware } from "../../middleware/auth";
import { requireAdminOrSuperAdmin } from "../../middleware/staff";

const router = express.Router();

router.get("/", authMiddleware, requireAdminOrSuperAdmin, getPropertyRequirements);
router.put("/:id", authMiddleware, requireAdminOrSuperAdmin, updateRequirementStatus);

export default router;
