import express from "express";
import userAnalytics from "./user.analytics.route";

const router = express.Router();

router.use("/analytics", userAnalytics);

export default router;