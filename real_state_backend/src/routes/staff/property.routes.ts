import express from "express";
import { addBookMark, removeBookMark, getBookMarks,acquisitionRequest ,acquisitionRequestApproval} from "../../controllers/staff/properties.staff";
import { authMiddleware } from "../../middleware/auth";
import { requireAdminOrSuperAdmin, requireSupportOrAbove, requireSuperAdmin } from "../../middleware/staff";
const router = express.Router();

router.post("/bookmark", authMiddleware, requireSupportOrAbove, addBookMark);
router.delete("/bookmark", authMiddleware, requireSupportOrAbove, removeBookMark);
router.get("/bookmarks", authMiddleware, requireSupportOrAbove, getBookMarks);
router.post("/acquisition-request", authMiddleware, requireAdminOrSuperAdmin, acquisitionRequest);
router.post("/acquisition-request-approval", authMiddleware, requireSuperAdmin, acquisitionRequestApproval);

export default router;