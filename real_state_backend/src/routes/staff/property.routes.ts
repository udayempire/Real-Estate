import express from "express";
import { addBookMark, removeBookMark, getBookMarks, acquisitionRequest, acquisitionRequestApproval, createExclusiveProperty, updateExclusiveProperty, getAllProperties, getAllExclusiveProperties, getProperty, getExclusiveProperty, updatePropertyStatus, getPendingApprovalProperties, getPendingExclusiveProperties, deleteUserListingProperty } from "../../controllers/staff/properties.staff";
import { authMiddleware } from "../../middleware/auth";
import { requireAdminOrSuperAdmin, requireSupportOrAbove, requireSuperAdmin } from "../../middleware/staff";
import { validate } from "../../middleware/validate";
import { createExclusivePropertySchema, updateExclusivePropertySchema } from "../../validators/property.validators";

const router = express.Router();

router.get("/", authMiddleware, requireSupportOrAbove, getAllProperties);
router.get("/bookmarks", authMiddleware, requireSupportOrAbove, getBookMarks);
router.get("/pending-approvals", authMiddleware, requireSupportOrAbove, getPendingApprovalProperties);
router.get("/pending-exclusive", authMiddleware, requireSuperAdmin, getPendingExclusiveProperties);
router.get("/exclusive", authMiddleware, requireSupportOrAbove, getAllExclusiveProperties);
router.get("/exclusive/:exclusivePropertyId", authMiddleware, requireSupportOrAbove, getExclusiveProperty);
router.get("/:propertyId", authMiddleware, requireSupportOrAbove, getProperty);
router.post("/bookmark", authMiddleware, requireSupportOrAbove, addBookMark);
router.delete("/bookmark", authMiddleware, requireSupportOrAbove, removeBookMark);
router.post("/acquisition-request", authMiddleware, requireAdminOrSuperAdmin, acquisitionRequest);
router.post("/acquisition-request-approval", authMiddleware, requireSuperAdmin, acquisitionRequestApproval);
router.post("/:propertyId/exclusive", authMiddleware, requireSuperAdmin, validate(createExclusivePropertySchema), createExclusiveProperty);
router.put("/exclusive/:exclusivePropertyId", authMiddleware, requireSuperAdmin, validate(updateExclusivePropertySchema), updateExclusiveProperty);
router.put("/:propertyId/status", authMiddleware, requireAdminOrSuperAdmin, updatePropertyStatus);
router.delete("/:propertyId", authMiddleware, requireAdminOrSuperAdmin, deleteUserListingProperty);

export default router;