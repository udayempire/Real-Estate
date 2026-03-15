import express from "express";
import { getAllAppointments, acceptAppointment, rejectAppointment } from "../../controllers/staff/appointments.staff.controller";
import { authMiddleware } from "../../middleware/auth";
import { requireSupportOrAbove } from "../../middleware/staff";

const router = express.Router();

router.get("/", authMiddleware, requireSupportOrAbove, getAllAppointments);
router.put("/:id/accept", authMiddleware, requireSupportOrAbove, acceptAppointment);
router.put("/:id/reject", authMiddleware, requireSupportOrAbove, rejectAppointment);

export default router;
