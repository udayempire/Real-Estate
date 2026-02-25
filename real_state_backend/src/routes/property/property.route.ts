import express from "express";
import { authMiddleware } from "../../middleware/auth";
import { addMedia, addProperty, addDraftProperty, updateDraftProperty, changeStatus, deleteMedia, deleteProperty, getAllProperties, getMyProperties, getProperty, updateProperty, filterProperties, searchProperties } from "../../controllers/properties/property.controller";
import { validate, validateQuery } from "../../middleware/validate";
import { addPropertySchema, addDraftPropertySchema, changeStatus as changeStatusSchema, updatePropertySchema, filterPropertiesSchema, searchPropertiesSchema } from "../../validators/property.validators";

const router = express.Router();

router.post("/", authMiddleware, validate(addPropertySchema), addProperty); //adds both property and media
router.post("/draft", authMiddleware, validate(addDraftPropertySchema), addDraftProperty); //adds draft property - only title required
router.put("/draft/:id", authMiddleware, validate(addDraftPropertySchema), updateDraftProperty); //updates draft property - save progress
router.get("/", authMiddleware, getAllProperties);
router.get("/search", validateQuery(searchPropertiesSchema), searchProperties); //search properties by title and location (only active)
router.get("/filter", validateQuery(filterPropertiesSchema), filterProperties); //filter/search properties with multiple criteria
router.get("/my-properties", authMiddleware, getMyProperties);
router.get("/:id", authMiddleware, getProperty);
router.put("/:id", authMiddleware,validate(updatePropertySchema), updateProperty);
router.post("/:id/media", authMiddleware, addMedia); //adds media if porperty exists
router.delete("/:id", authMiddleware, deleteProperty);
router.delete("/media/:id",authMiddleware,deleteMedia);
router.put("/change-status/:id",authMiddleware, validate(changeStatusSchema), changeStatus);

export default router;