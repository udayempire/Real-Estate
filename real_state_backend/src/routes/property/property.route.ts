import express from "express";
import { authMiddleware } from "../../middleware/auth";
import { addProperty } from "../../controllers/properties/property.controller";
import { validate } from "../../middleware/validate";
import { addPropertySchema } from "../../validators/property.validators";

const router = express.Router();

router.post("/",authMiddleware,validate(addPropertySchema), addProperty);

export default router;