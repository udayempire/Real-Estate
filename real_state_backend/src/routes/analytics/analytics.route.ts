import express from "express";
import userAnalytics from "./user.analytics.route";
import propertiesAnalytics from "./properties.analytics.route";
import financialsAnalytics from "./financials.analytics.route";

const router = express.Router();

router.use("/analytics", userAnalytics);
router.use("/analytics", propertiesAnalytics);
router.use("/analytics", financialsAnalytics);

export default router;