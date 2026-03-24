import { Request, Response } from "express";
import {
  getFinancialsAnalyticsSummary,
  toCompactFinancialsAnalytics,
} from "../../services/analytics/financials.analytics.service";

export async function getFinancialsAnalytics(req: Request, res: Response) {
  try {
    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    const view = typeof req.query.view === "string" ? req.query.view.toLowerCase() : undefined;

    const data = await getFinancialsAnalyticsSummary({ from, to });
    const responseData = view === "compact" ? toCompactFinancialsAnalytics(data) : data;

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    if (error?.message?.includes("from") || error?.message?.includes("date")) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Financial analytics error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
