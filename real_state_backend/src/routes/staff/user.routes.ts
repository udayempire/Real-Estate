import express from "express";
import { getAllUsers, fullUserDetails } from "../../controllers/staff/user.staff.controller";
import { authMiddleware } from "../../middleware/auth";
import { requireAdminOrSuperAdmin } from "../../middleware/staff";
const router = express.Router();

router.get("/", authMiddleware, requireAdminOrSuperAdmin, getAllUsers);
router.get("/:id", authMiddleware, requireAdminOrSuperAdmin, fullUserDetails);

export default router;