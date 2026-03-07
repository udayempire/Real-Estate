import express from "express";
import { authMiddleware } from "../../middleware/auth";
import { gemRequests, giveGemsToUser, previewGemAllocation } from "../../controllers/staff/staff.gems.controller";
import { approveGemRequest, rejectGemRequest,  } from "../../controllers/staff/staff.gems.controller";
import { requireSuperAdmin,requireAdminOrSuperAdmin } from "../../middleware/staff";
const router = express.Router();

router.post("/preview", authMiddleware, requireAdminOrSuperAdmin, previewGemAllocation);
router.post("/give", authMiddleware, requireAdminOrSuperAdmin, giveGemsToUser);
router.get("/gem-requests", authMiddleware, requireAdminOrSuperAdmin, gemRequests);
router.post("/approve", authMiddleware, requireSuperAdmin, approveGemRequest);
router.post("/reject", authMiddleware, requireSuperAdmin, rejectGemRequest);
// router.post("/allot", authMiddleware, requireSuperAdmin, allotGemsToProperty);


export default router;