import express from "express";
import { getSupportTickets } from "../../controllers/staff/supportTicket.staff.controller";

const router = express.Router();

router.get("/", getSupportTickets);

export default router;

