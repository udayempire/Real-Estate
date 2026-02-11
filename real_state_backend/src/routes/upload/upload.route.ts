import express from "express";
import { presignedUpload } from "../../controllers/upload/upload.controller";
import { validate } from "../../middleware/validate";
import { uploadSchema } from "../../validators/upload.validator";

const router = express.Router();
router.post("/presign", validate(uploadSchema),presignedUpload);

export default router;