import express from "express";
import { createStaff } from "../../controllers/staff/staff.management.controller";
import { authMiddleware } from "../../middleware/auth";
import { requireSuperAdmin } from "../../middleware/staff";
import { validate } from "../../middleware/validate";
import { createStaffSchema } from "../../validators/staff.validator";
const router = express.Router();

router.post('/create-staff',authMiddleware,requireSuperAdmin,validate(createStaffSchema),createStaff);

// router.put('/update', updateStaff);
// router.put('/block', blockStaff);

export default router;