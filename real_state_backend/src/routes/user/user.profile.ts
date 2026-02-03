import express from "express";
import { authMiddleware } from "../../middleware/auth";
import { getProfile } from "../../controllers/user/profile.controller";

const router = express.Router();

///api/v1/user/profile
router.get('/',authMiddleware,getProfile);

export default router;