import express from "express";
import { getAllUsers, getAllBlockedUsers, fullUserDetails, getUserForEdit, updateUserByStaff, updateKycStatus, deleteUser, blockUser, unblockUser } from "../../controllers/staff/user.staff.controller";
import { authMiddleware } from "../../middleware/auth";
import { requireAdminOrSuperAdmin } from "../../middleware/staff";
const router = express.Router();

router.get("/", authMiddleware, requireAdminOrSuperAdmin, getAllUsers);
router.get("/blocked", authMiddleware, requireAdminOrSuperAdmin, getAllBlockedUsers);
router.get("/:id", authMiddleware, requireAdminOrSuperAdmin, fullUserDetails);
router.get("/:id/edit", authMiddleware, requireAdminOrSuperAdmin, getUserForEdit);
router.put("/:id", authMiddleware, requireAdminOrSuperAdmin, updateUserByStaff);
router.put("/:id/kyc/:kycId", authMiddleware, requireAdminOrSuperAdmin, updateKycStatus);
router.delete("/:id", authMiddleware, requireAdminOrSuperAdmin, deleteUser);
router.put("/:id/block", authMiddleware, requireAdminOrSuperAdmin, blockUser);
router.put("/:id/unblock", authMiddleware, requireAdminOrSuperAdmin, unblockUser);

export default router;