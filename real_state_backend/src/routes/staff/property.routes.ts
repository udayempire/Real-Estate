import express from "express";
import { addBookMark, removeBookMark, getBookMarks, acquisitionRequest, acquisitionRequestApproval, createExclusiveProperty, updateExclusiveProperty } from "../../controllers/staff/properties.staff";
import { authMiddleware } from "../../middleware/auth";
import { requireAdminOrSuperAdmin, requireSupportOrAbove, requireSuperAdmin } from "../../middleware/staff";
import { validate } from "../../middleware/validate";
import { createExclusivePropertySchema, updateExclusivePropertySchema } from "../../validators/property.validators";

const router = express.Router();

router.post("/bookmark", authMiddleware, requireSupportOrAbove, addBookMark);
router.delete("/bookmark", authMiddleware, requireSupportOrAbove, removeBookMark);
router.get("/bookmarks", authMiddleware, requireSupportOrAbove, getBookMarks);
router.post("/acquisition-request", authMiddleware, requireAdminOrSuperAdmin, acquisitionRequest);
router.post("/acquisition-request-approval", authMiddleware, requireSuperAdmin, acquisitionRequestApproval);
router.post("/:propertyId/exclusive", authMiddleware, requireSuperAdmin, validate(createExclusivePropertySchema), createExclusiveProperty);
router.put("/exclusive/:exclusivePropertyId", authMiddleware, requireSuperAdmin, validate(updateExclusivePropertySchema), updateExclusiveProperty);

export default router;