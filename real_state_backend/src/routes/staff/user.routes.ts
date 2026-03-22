import express from "express";
import { getAllUsers, getAllBlockedUsers, getAllBanRequests, reviewBanRequest, fullUserDetails, getUserForEdit, updateUserByStaff, updateKycStatus, deleteUser, blockUser, unblockUser, kycProxyDownload } from "../../controllers/staff/user.staff.controller";
import { getTransactionHistory } from "../../controllers/staff/transactionHistory";
import { authMiddleware } from "../../middleware/auth";
import { requireAdminOrSuperAdmin, requireSuperAdmin, requireViewerOrAbove } from "../../middleware/staff";
const router = express.Router();

router.get("/", authMiddleware, requireAdminOrSuperAdmin, getAllUsers);
router.get("/blocked", authMiddleware, requireAdminOrSuperAdmin, getAllBlockedUsers);
router.get("/ban-requests", authMiddleware, requireAdminOrSuperAdmin, getAllBanRequests);
router.put("/ban-requests/:requestId", authMiddleware, requireSuperAdmin, reviewBanRequest);
router.get("/kyc-proxy-download", authMiddleware, requireAdminOrSuperAdmin, kycProxyDownload);
router.get("/:id/transaction-history", authMiddleware, requireAdminOrSuperAdmin, (req, res, next) => {
    req.query.userId = req.params.id;
    next();
}, getTransactionHistory);
router.get("/:id", authMiddleware, requireViewerOrAbove, fullUserDetails);
router.get("/:id/edit", authMiddleware, requireAdminOrSuperAdmin, getUserForEdit);
router.put("/:id", authMiddleware, requireAdminOrSuperAdmin, updateUserByStaff);
router.put("/:id/kyc/:kycId", authMiddleware, requireAdminOrSuperAdmin, updateKycStatus);
router.delete("/:id", authMiddleware, requireAdminOrSuperAdmin, deleteUser);
router.put("/:id/block", authMiddleware, requireAdminOrSuperAdmin, blockUser);
router.put("/:id/unblock", authMiddleware, requireAdminOrSuperAdmin, unblockUser);

export default router;