import express from "express";
import { authMiddleware } from "../../middleware/auth";
import { allGemTransactionHistory, gemRequests, getGemStats, giveAcquisitionRewardToUser, previewGemAllocation, sendGemOtp } from "../../controllers/staff/gems.staff";
import { approveGemRequest, rejectGemRequest } from "../../controllers/staff/gems.staff";
import {
    createRedeemRequest,
    getRedeemRequests,
    approveRedeemRequest,
    rejectRedeemRequest,
    directRedeemGems,
} from "../../controllers/staff/redeem.staff";
import { requireSuperAdmin, requireAdminOrSuperAdmin } from "../../middleware/staff";
const router = express.Router();

router.post("/preview", authMiddleware, requireAdminOrSuperAdmin, previewGemAllocation);
router.post("/send-otp", authMiddleware, requireAdminOrSuperAdmin, sendGemOtp);
router.post("/give", authMiddleware, requireAdminOrSuperAdmin, giveAcquisitionRewardToUser);
router.get("/gem-requests", authMiddleware, requireAdminOrSuperAdmin, gemRequests);
router.get("/transactions", authMiddleware, requireAdminOrSuperAdmin, allGemTransactionHistory);
router.get("/stats", authMiddleware, requireAdminOrSuperAdmin, getGemStats);
router.post("/approve", authMiddleware, requireSuperAdmin, approveGemRequest);
router.post("/reject", authMiddleware, requireSuperAdmin, rejectGemRequest);

router.post("/redeem-user-gems", authMiddleware, requireAdminOrSuperAdmin, createRedeemRequest);
router.get("/redeem-requests", authMiddleware, requireAdminOrSuperAdmin, getRedeemRequests);
router.post("/approve-redeem-request", authMiddleware, requireSuperAdmin, approveRedeemRequest);
router.post("/reject-redeem-request", authMiddleware, requireSuperAdmin, rejectRedeemRequest);
router.post("/direct-redeem-gems", authMiddleware, requireSuperAdmin, directRedeemGems);
// router.post("/allot", authMiddleware, requireSuperAdmin, allotGemsToProperty);


export default router;