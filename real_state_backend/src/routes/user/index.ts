import express from "express";
import authRoutes from "./user.auth";
import profileRoutes from "./user.profile"
const router = express.Router();

router.use('/auth',authRoutes);
router.use('/profile',profileRoutes);
export default router;