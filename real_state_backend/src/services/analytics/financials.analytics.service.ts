import { prisma } from "../../config/prisma";

type DateRangeInput = {
  from?: string;
  to?: string;
};

type DateRange = {
  start: Date;
  end: Date;
};

type FinancialSnapshot = {
  gemsRedeemedAmount: number;
  totalGemsPaid: number;
  totalRevenueBySellingExclusiveProperties: number;
};

type FinancialWindows = {
  "1d": FinancialSnapshot;
  "7d": FinancialSnapshot;
  "30d": FinancialSnapshot;
  "90d": FinancialSnapshot;
  "180d": FinancialSnapshot;
  "1y": FinancialSnapshot;
};

type FinancialsAnalyticsResponse = {
  windows: FinancialWindows;
  customRange: {
    from: string;
    to: string;
    metrics: FinancialSnapshot | null;
  } | null;
};

function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function endOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function daysAgoStartUTC(daysAgo: number): Date {
  const now = new Date();
  const d = new Date(now);
  d.setUTCDate(now.getUTCDate() - daysAgo);
  return startOfDayUTC(d);
}

function parseDateRange(input: DateRangeInput): DateRange | null {
  if (!input.from && !input.to) return null;
  if (!input.from || !input.to) {
    throw new Error("Both from and to are required for date range.");
  }

  const from = new Date(input.from);
  const to = new Date(input.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new Error("Invalid from/to date format. Use YYYY-MM-DD.");
  }

  const start = startOfDayUTC(from);
  const end = endOfDayUTC(to);
  if (start > end) {
    throw new Error("from cannot be greater than to.");
  }
  return { start, end };
}

async function computeFinancialSnapshot(range: DateRange): Promise<FinancialSnapshot> {
  const [
    gemsRedeemed,
    totalGemsPaid,
    soldExclusiveRevenue,
  ] = await Promise.all([
    prisma.gemTransaction.aggregate({
      where: {
        reason: "GEM_REDEEM",
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      _sum: { amount: true },
    }),
    prisma.gemTransaction.aggregate({
      where: {
        txnType: "CREDIT",
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      _sum: { amount: true },
    }),
    prisma.exclusiveProperty.aggregate({
      where: {
        status: "SOLD_OUT",
        OR: [
          {
            soldOutAt: {
              gte: range.start,
              lte: range.end,
            },
          },
          {
            soldOutAt: null,
            updatedAt: {
              gte: range.start,
              lte: range.end,
            },
          },
        ],
      },
      _sum: { listingPrice: true },
    }),
  ]);

  return {
    gemsRedeemedAmount: gemsRedeemed._sum.amount ?? 0,
    totalGemsPaid: totalGemsPaid._sum.amount ?? 0,
    totalRevenueBySellingExclusiveProperties: soldExclusiveRevenue._sum.listingPrice ?? 0,
  };
}

export async function getFinancialsAnalyticsSummary(input: DateRangeInput): Promise<FinancialsAnalyticsResponse> {
  const now = new Date();
  const todayEnd = endOfDayUTC(now);

  const ranges = {
    d1: { start: daysAgoStartUTC(0), end: todayEnd },
    d7: { start: daysAgoStartUTC(6), end: todayEnd },
    d30: { start: daysAgoStartUTC(29), end: todayEnd },
    d90: { start: daysAgoStartUTC(89), end: todayEnd },
    d180: { start: daysAgoStartUTC(179), end: todayEnd },
    y1: { start: daysAgoStartUTC(364), end: todayEnd },
  };

  const customRange = parseDateRange(input);

  const [d1, d7, d30, d90, d180, y1, custom] = await Promise.all([
    computeFinancialSnapshot(ranges.d1),
    computeFinancialSnapshot(ranges.d7),
    computeFinancialSnapshot(ranges.d30),
    computeFinancialSnapshot(ranges.d90),
    computeFinancialSnapshot(ranges.d180),
    computeFinancialSnapshot(ranges.y1),
    customRange ? computeFinancialSnapshot(customRange) : Promise.resolve(null),
  ]);

  return {
    windows: {
      "1d": d1,
      "7d": d7,
      "30d": d30,
      "90d": d90,
      "180d": d180,
      "1y": y1,
    },
    customRange: customRange
      ? {
          from: customRange.start.toISOString(),
          to: customRange.end.toISOString(),
          metrics: custom,
        }
      : null,
  };
}

export function toCompactFinancialsAnalytics(data: FinancialsAnalyticsResponse) {
  return {
    d1GemsRedeemedAmount: data.windows["1d"].gemsRedeemedAmount,
    d1TotalGemsPaid: data.windows["1d"].totalGemsPaid,
    d1TotalRevenueBySellingExclusiveProperties: data.windows["1d"].totalRevenueBySellingExclusiveProperties,

    d7GemsRedeemedAmount: data.windows["7d"].gemsRedeemedAmount,
    d7TotalGemsPaid: data.windows["7d"].totalGemsPaid,
    d7TotalRevenueBySellingExclusiveProperties: data.windows["7d"].totalRevenueBySellingExclusiveProperties,

    d30GemsRedeemedAmount: data.windows["30d"].gemsRedeemedAmount,
    d30TotalGemsPaid: data.windows["30d"].totalGemsPaid,
    d30TotalRevenueBySellingExclusiveProperties: data.windows["30d"].totalRevenueBySellingExclusiveProperties,

    d90GemsRedeemedAmount: data.windows["90d"].gemsRedeemedAmount,
    d90TotalGemsPaid: data.windows["90d"].totalGemsPaid,
    d90TotalRevenueBySellingExclusiveProperties: data.windows["90d"].totalRevenueBySellingExclusiveProperties,

    d180GemsRedeemedAmount: data.windows["180d"].gemsRedeemedAmount,
    d180TotalGemsPaid: data.windows["180d"].totalGemsPaid,
    d180TotalRevenueBySellingExclusiveProperties: data.windows["180d"].totalRevenueBySellingExclusiveProperties,

    y1GemsRedeemedAmount: data.windows["1y"].gemsRedeemedAmount,
    y1TotalGemsPaid: data.windows["1y"].totalGemsPaid,
    y1TotalRevenueBySellingExclusiveProperties: data.windows["1y"].totalRevenueBySellingExclusiveProperties,

    customFrom: data.customRange?.from ?? null,
    customTo: data.customRange?.to ?? null,
    customGemsRedeemedAmount: data.customRange?.metrics?.gemsRedeemedAmount ?? null,
    customTotalGemsPaid: data.customRange?.metrics?.totalGemsPaid ?? null,
    customTotalRevenueBySellingExclusiveProperties:
      data.customRange?.metrics?.totalRevenueBySellingExclusiveProperties ?? null,
  };
}
