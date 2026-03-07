import express from "express";
import { createStaff, updateStaff } from "../../controllers/staff/staff.management.controller";
import { authMiddleware } from "../../middleware/auth";
import { requireSuperAdmin } from "../../middleware/staff";
import { validate } from "../../middleware/validate";
import { createStaffSchema,updateStaffSchema } from "../../validators/staff.validator";
import { getAllStaffs } from "../../controllers/staff/staff.management.controller";
const router = express.Router();

router.post('/create-staff',authMiddleware,requireSuperAdmin,validate(createStaffSchema),createStaff);
router.put('/update-staff',authMiddleware,requireSuperAdmin,validate(updateStaffSchema),updateStaff);
router.get('/get-staffs',authMiddleware,requireSuperAdmin,getAllStaffs);
// router.put('/block', blockStaff);

export default router;