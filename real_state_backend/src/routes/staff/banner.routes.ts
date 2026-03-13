import express from "express";
import { createBanner, getAllBanners, deleteBanner, updateBannerStatus } from "../../controllers/staff/banner.staff.controller";
const router = express.Router();

router.post('/', createBanner);
router.get('/', getAllBanners);
router.put('/:id/status', updateBannerStatus);
router.delete('/:id', deleteBanner);
export default router;