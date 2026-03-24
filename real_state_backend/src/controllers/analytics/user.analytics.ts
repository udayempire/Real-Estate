import { Request, Response } from "express";
import { getUserAnalyticsSummary } from "../../services/analytics/user.analytics.service";

export async function getUserAnalytics(req: Request, res: Response) {
  try {
    const role = req.user?.role;
    if (!req.user?.id || !role) return res.status(401).json({ message: "Unauthorized" });
    if (!["ADMIN", "SUPER_ADMIN"].includes(role)) return res.status(403).json({ message: "Forbidden" });

    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;

    const data = await getUserAnalyticsSummary({ from, to });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    if (error?.message?.includes("from") || error?.message?.includes("date")) {
      return res.status(400).json({ message: error.message });
    }
    console.error("User analytics error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}