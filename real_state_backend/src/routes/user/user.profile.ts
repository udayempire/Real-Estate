import express from "express";
import { authMiddleware } from "../../middleware/auth";
import { getProfile, updateProfile } from "../../controllers/user/profile.controller";
import { updateProfileSchema } from "../../validators/user.validator";
import { validate } from "../../middleware/validate";

const router = express.Router();

///api/v1/user/profile
router.get('/',authMiddleware,getProfile);
router.put("/", authMiddleware, validate(updateProfileSchema), updateProfile);

export default router;