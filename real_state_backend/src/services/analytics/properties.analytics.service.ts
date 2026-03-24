import { prisma } from "../../config/prisma";

type DateRangeInput = {
  from?: string;
  to?: string;
};

type PropertiesAnalyticsResponse = {
  dateRange: { from: string; to: string } | null;
  categoryDistribution: {
    totalCategorized: number;
    residential: { count: number; percentage: number };
    commercial: { count: number; percentage: number };
    farmland: { count: number; percentage: number };
  };
  inventoryVelocity: {
    added: { userListings: number; exclusiveListings: number; total: number };
    sold: { userListings: number; exclusiveListings: number; total: number };
    sellThroughRate: number;
  };
  inventoryDistribution: {
    userListings: {
      total: number;
      uniqueListingUsers: number;
      byPriceRange: {
        under5L: number;
        between5LAnd25L: number;
        between25LAnd50L: number;
        between50LAnd1Cr: number;
        above1Cr: number;
      };
    };
    exclusiveListings: {
      total: number;
      byStatus: { ACTIVE: number; SOLD_OUT: number; UNLISTED: number };
      byPriceRange: {
        under5L: number;
        between5LAnd25L: number;
        between25LAnd50L: number;
        between50LAnd1Cr: number;
        above1Cr: number;
      };
    };
  };
};

type DateRange = {
  start: Date;
  end: Date;
};

type CategoryGroupRow = {
  category: "RESIDENTIAL" | "COMMERCIAL" | "AGRICULTURAL" | null;
  _count: { _all: number };
};

type ExclusiveStatusGroupRow = {
  status: "ACTIVE" | "SOLD_OUT" | "UNLISTED";
  _count: { _all: number };
};

const CATEGORY_KEYS = ["RESIDENTIAL", "COMMERCIAL", "AGRICULTURAL"] as const;
const SOLD_PROPERTY_STATUSES = ["SOLDOFFLINE", "SOLDTOREALBRO", "SOLDFROMLISTINGS", "SOLDEXCLUSIVEPROPERTY"] as const;

function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function endOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
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

function rangeWhere(field: "createdAt" | "updatedAt", range: DateRange | null) {
  if (!range) return {};
  return {
    [field]: {
      gte: range.start,
      lte: range.end,
    },
  };
}

function rangeWhereExclusive(field: "createdAt" | "updatedAt", range: DateRange | null) {
  if (!range) return {};
  return {
    [field]: {
      gte: range.start,
      lte: range.end,
    },
  };
}

function percent(count: number, total: number): number {
  if (total === 0) return 0;
  return Number(((count / total) * 100).toFixed(2));
}

export async function getPropertiesAnalyticsSummary(input: DateRangeInput): Promise<PropertiesAnalyticsResponse> {
  const range = parseDateRange(input);

  const addedWhere = rangeWhere("createdAt", range);
  const soldWhere = {
    ...rangeWhere("updatedAt", range),
    status: {
      in: [...SOLD_PROPERTY_STATUSES],
    },
  };

  const exclusiveAddedWhere = rangeWhereExclusive("createdAt", range);
  const exclusiveSoldWhere = {
    ...rangeWhereExclusive("updatedAt", range),
    status: "SOLD_OUT",
  };

  const [
    totalUserListings,
    totalExclusiveListings,
    categoryGroups,
    userListingsAdded,
    userListingsSold,
    exclusiveListingsAdded,
    exclusiveListingsSold,
    uniqueListingUsers,
    userListingsUnder5L,
    userListings5Lto25L,
    userListings25Lto50L,
    userListings50Lto1Cr,
    userListingsAbove1Cr,
    exclusiveListingsUnder5L,
    exclusiveListings5Lto25L,
    exclusiveListings25Lto50L,
    exclusiveListings50Lto1Cr,
    exclusiveListingsAbove1Cr,
    exclusiveStatusGroups,
  ] = await Promise.all<[
    number,
    number,
    CategoryGroupRow[],
    number,
    number,
    number,
    number,
    { userId: string }[],
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    ExclusiveStatusGroupRow[]
  ]>([
    prisma.property.count(),
    prisma.exclusiveProperty.count(),
    prisma.property.groupBy({
      by: ["category"],
      _count: { _all: true },
    }),
    prisma.property.count({ where: addedWhere }),
    prisma.property.count({ where: soldWhere }),
    prisma.exclusiveProperty.count({ where: exclusiveAddedWhere }),
    prisma.exclusiveProperty.count({ where: exclusiveSoldWhere }),
    prisma.property.findMany({
      where: { userId: { not: undefined } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.property.count({ where: { listingPrice: { not: null, lt: 500000 } } }),
    prisma.property.count({ where: { listingPrice: { not: null, gte: 500000, lt: 2500000 } } }),
    prisma.property.count({ where: { listingPrice: { not: null, gte: 2500000, lt: 5000000 } } }),
    prisma.property.count({ where: { listingPrice: { not: null, gte: 5000000, lt: 10000000 } } }),
    prisma.property.count({ where: { listingPrice: { not: null, gte: 10000000 } } }),
    prisma.exclusiveProperty.count({ where: { listingPrice: { not: null, lt: 500000 } } }),
    prisma.exclusiveProperty.count({ where: { listingPrice: { not: null, gte: 500000, lt: 2500000 } } }),
    prisma.exclusiveProperty.count({ where: { listingPrice: { not: null, gte: 2500000, lt: 5000000 } } }),
    prisma.exclusiveProperty.count({ where: { listingPrice: { not: null, gte: 5000000, lt: 10000000 } } }),
    prisma.exclusiveProperty.count({ where: { listingPrice: { not: null, gte: 10000000 } } }),
    prisma.exclusiveProperty.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const totalCategorized = categoryGroups.reduce((sum: number, row: CategoryGroupRow) => sum + row._count._all, 0);
  const categoryCountMap: Record<(typeof CATEGORY_KEYS)[number], number> = {
    RESIDENTIAL: 0,
    COMMERCIAL: 0,
    AGRICULTURAL: 0,
  };

  categoryGroups.forEach((row: CategoryGroupRow) => {
    if (!row.category) return;
    if (row.category in categoryCountMap) {
      categoryCountMap[row.category as keyof typeof categoryCountMap] = row._count._all;
    }
  });

  const totalAdded = userListingsAdded + exclusiveListingsAdded;
  const totalSold = userListingsSold + exclusiveListingsSold;

  const exclusiveStatusCounts = {
    ACTIVE: 0,
    SOLD_OUT: 0,
    UNLISTED: 0,
  };

  exclusiveStatusGroups.forEach((row: ExclusiveStatusGroupRow) => {
    exclusiveStatusCounts[row.status] = row._count._all;
  });

  return {
    dateRange: range
      ? {
          from: range.start.toISOString(),
          to: range.end.toISOString(),
        }
      : null,
    categoryDistribution: {
      totalCategorized,
      residential: {
        count: categoryCountMap.RESIDENTIAL,
        percentage: percent(categoryCountMap.RESIDENTIAL, totalCategorized),
      },
      commercial: {
        count: categoryCountMap.COMMERCIAL,
        percentage: percent(categoryCountMap.COMMERCIAL, totalCategorized),
      },
      farmland: {
        count: categoryCountMap.AGRICULTURAL,
        percentage: percent(categoryCountMap.AGRICULTURAL, totalCategorized),
      },
    },
    inventoryVelocity: {
      added: {
        userListings: userListingsAdded,
        exclusiveListings: exclusiveListingsAdded,
        total: totalAdded,
      },
      sold: {
        userListings: userListingsSold,
        exclusiveListings: exclusiveListingsSold,
        total: totalSold,
      },
      sellThroughRate: percent(totalSold, totalAdded),
    },
    inventoryDistribution: {
      userListings: {
        total: totalUserListings,
        uniqueListingUsers: uniqueListingUsers.length,
        byPriceRange: {
          under5L: userListingsUnder5L,
          between5LAnd25L: userListings5Lto25L,
          between25LAnd50L: userListings25Lto50L,
          between50LAnd1Cr: userListings50Lto1Cr,
          above1Cr: userListingsAbove1Cr,
        },
      },
      exclusiveListings: {
        total: totalExclusiveListings,
        byStatus: exclusiveStatusCounts,
        byPriceRange: {
          under5L: exclusiveListingsUnder5L,
          between5LAnd25L: exclusiveListings5Lto25L,
          between25LAnd50L: exclusiveListings25Lto50L,
          between50LAnd1Cr: exclusiveListings50Lto1Cr,
          above1Cr: exclusiveListingsAbove1Cr,
        },
      },
    },
  };
}

export function toCompactPropertiesAnalytics(data: PropertiesAnalyticsResponse) {
  return {
    from: data.dateRange?.from ?? null,
    to: data.dateRange?.to ?? null,
    totalCategorizedProperties: data.categoryDistribution.totalCategorized,
    residentialCount: data.categoryDistribution.residential.count,
    residentialPercentage: data.categoryDistribution.residential.percentage,
    commercialCount: data.categoryDistribution.commercial.count,
    commercialPercentage: data.categoryDistribution.commercial.percentage,
    farmlandCount: data.categoryDistribution.farmland.count,
    farmlandPercentage: data.categoryDistribution.farmland.percentage,
    propertiesAddedTotal: data.inventoryVelocity.added.total,
    propertiesAddedUserListings: data.inventoryVelocity.added.userListings,
    propertiesAddedExclusiveListings: data.inventoryVelocity.added.exclusiveListings,
    propertiesSoldTotal: data.inventoryVelocity.sold.total,
    propertiesSoldUserListings: data.inventoryVelocity.sold.userListings,
    propertiesSoldExclusiveListings: data.inventoryVelocity.sold.exclusiveListings,
    sellThroughRate: data.inventoryVelocity.sellThroughRate,
    userListingsTotal: data.inventoryDistribution.userListings.total,
    userListingsUniqueUsers: data.inventoryDistribution.userListings.uniqueListingUsers,
    userListingsPriceUnder5L: data.inventoryDistribution.userListings.byPriceRange.under5L,
    userListingsPrice5LTo25L: data.inventoryDistribution.userListings.byPriceRange.between5LAnd25L,
    userListingsPrice25LTo50L: data.inventoryDistribution.userListings.byPriceRange.between25LAnd50L,
    userListingsPrice50LTo1Cr: data.inventoryDistribution.userListings.byPriceRange.between50LAnd1Cr,
    userListingsPriceAbove1Cr: data.inventoryDistribution.userListings.byPriceRange.above1Cr,
    exclusiveListingsTotal: data.inventoryDistribution.exclusiveListings.total,
    exclusiveListingsStatusActive: data.inventoryDistribution.exclusiveListings.byStatus.ACTIVE,
    exclusiveListingsStatusSoldOut: data.inventoryDistribution.exclusiveListings.byStatus.SOLD_OUT,
    exclusiveListingsStatusUnlisted: data.inventoryDistribution.exclusiveListings.byStatus.UNLISTED,
    exclusiveListingsPriceUnder5L: data.inventoryDistribution.exclusiveListings.byPriceRange.under5L,
    exclusiveListingsPrice5LTo25L: data.inventoryDistribution.exclusiveListings.byPriceRange.between5LAnd25L,
    exclusiveListingsPrice25LTo50L: data.inventoryDistribution.exclusiveListings.byPriceRange.between25LAnd50L,
    exclusiveListingsPrice50LTo1Cr: data.inventoryDistribution.exclusiveListings.byPriceRange.between50LAnd1Cr,
    exclusiveListingsPriceAbove1Cr: data.inventoryDistribution.exclusiveListings.byPriceRange.above1Cr,
  };
}
