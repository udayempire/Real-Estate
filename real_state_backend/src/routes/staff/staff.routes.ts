import express from "express";
const router = express.Router();
import staffManagementRoutes from "./staff.management";
import staffAuthRoutes from "./staff.auth";
router.use('/auth', staffAuthRoutes);
router.use('/management', staffManagementRoutes);

export default router;