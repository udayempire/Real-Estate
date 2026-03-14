import express from "express";
const router = express.Router();
import staffManagementRoutes from "./staff.management";
import staffAuthRoutes from "./staff.auth";
import staffGemsRoutes from "./gems.routes";
import staffPropertyRoutes from "./property.routes";
import userRoutes from "./user.routes";
import bannerRoutes from "./banner.routes";
import supportTicketsRoutes from "./supportTickets.routes";


router.use('/auth', staffAuthRoutes);
router.use('/management', staffManagementRoutes);
router.use('/gems', staffGemsRoutes);
router.use('/properties', staffPropertyRoutes);
router.use('/users', userRoutes);
router.use('/banners', bannerRoutes);
router.use('/support-tickets', supportTicketsRoutes);
export default router;