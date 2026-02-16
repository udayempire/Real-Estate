import express from "express";
import { authMiddleware } from "../../middleware/auth";
import { addMedia, addProperty, changeStatus, deleteMedia, deleteProperty, getAllProperties, getMyProperties, getProperty, updateProperty } from "../../controllers/properties/property.controller";
import { validate } from "../../middleware/validate";
import { addPropertySchema, changeStatus as changeStatusSchema, updatePropertySchema } from "../../validators/property.validators";

const router = express.Router();

router.post("/", authMiddleware, validate(addPropertySchema), addProperty); //adds both property and media
router.get("/", authMiddleware, getAllProperties);
router.get("/my-properties", authMiddleware, getMyProperties);
router.get("/:id", authMiddleware, getProperty);
router.put("/:id", authMiddleware,validate(updatePropertySchema), updateProperty);
router.post("/:id/media", authMiddleware, addMedia); //adds media if porperty exists
router.delete("/:id", authMiddleware, deleteProperty);
router.delete("/media/:id",authMiddleware,deleteMedia);
router.put("/change-status/:id",authMiddleware, validate(changeStatusSchema), changeStatus);

export default router;