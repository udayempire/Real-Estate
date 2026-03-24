import { prisma } from "../../config/prisma";

type DateRangeInput = {
  from?: string;
  to?: string;
};

type UserIdRow = {
  userId: string | null;
};

type UserAnalyticsResponse = {
  totalUsers: number;
  newUsersToday: number;
  activeUsersToday: number;
  activeUsers7d: number;
  activeUsers30d: number;
  activeUsers90d: number;
  activeUsers180d: number;
  activeUsers365d: number;
  range: {
    from: string;
    to: string;
    newUsers: number | null;
    activeUsers: number | null;
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

function parseDateRange(input: DateRangeInput) {
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

async function getActiveUserCountBetween(start: Date, end: Date): Promise<number> {
  const [refreshIds, deviceIds, appointmentIds, requirementIds, propertyIds] = await Promise.all<
    [UserIdRow[], UserIdRow[], UserIdRow[], UserIdRow[], UserIdRow[]]
  >([
    prisma.refreshToken.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.userDeviceToken.findMany({
      where: { isActive: true, lastSeenAt: { gte: start, lte: end } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.appointment.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.propertyRequirement.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.property.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const addRows = (rows: UserIdRow[], set: Set<string>) => {
    rows.forEach((row: UserIdRow) => {
      if (row.userId) {
        set.add(row.userId);
      }
    });
  };

  const set = new Set<string>();
  addRows(refreshIds, set);
  addRows(deviceIds, set);
  addRows(appointmentIds, set);
  addRows(requirementIds, set);
  addRows(propertyIds, set);

  return set.size;
}

export async function getUserAnalyticsSummary(input: DateRangeInput): Promise<UserAnalyticsResponse> {
  const now = new Date();

  const todayStart = startOfDayUTC(now);
  const todayEnd = endOfDayUTC(now);

  const start7d = daysAgoStartUTC(6);   // today + previous 6 days
  const start30d = daysAgoStartUTC(29); // today + previous 29 days
  const start90d = daysAgoStartUTC(89); // today + previous 89 days
  const start180d = daysAgoStartUTC(179); // today + previous 179 days
  const start365d = daysAgoStartUTC(364); // today + previous 364 days

  const range = parseDateRange(input);

  const [
    totalUsers,
    newUsersToday,
    activeUsersToday,
    activeUsers7d,
    activeUsers30d,
    activeUsers90d,
    activeUsers180d,
    activeUsers365d,
    newUsersInRange,
    activeUsersInRange,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } }),
    getActiveUserCountBetween(todayStart, todayEnd),
    getActiveUserCountBetween(start7d, todayEnd),
    getActiveUserCountBetween(start30d, todayEnd),
    getActiveUserCountBetween(start90d, todayEnd),
    getActiveUserCountBetween(start180d, todayEnd),
    getActiveUserCountBetween(start365d, todayEnd),
    range
      ? prisma.user.count({ where: { createdAt: { gte: range.start, lte: range.end } } })
      : Promise.resolve(null),
    range
      ? getActiveUserCountBetween(range.start, range.end)
      : Promise.resolve(null),
  ]);

  return {
    totalUsers,
    newUsersToday,
    activeUsersToday,
    activeUsers7d,
    activeUsers30d,
    activeUsers90d,
    activeUsers180d,
    activeUsers365d,
    range: range
      ? {
          from: range.start.toISOString(),
          to: range.end.toISOString(),
          newUsers: newUsersInRange,
          activeUsers: activeUsersInRange,
        }
      : null,
  };
}

export function toCompactUserAnalytics(data: UserAnalyticsResponse) {
  return {
    totalUsers: data.totalUsers,
    newUsersToday: data.newUsersToday,
    activeUsersToday: data.activeUsersToday,
    activeUsers7d: data.activeUsers7d,
    activeUsers30d: data.activeUsers30d,
    activeUsers90d: data.activeUsers90d,
    activeUsers180d: data.activeUsers180d,
    activeUsers365d: data.activeUsers365d,
    customFrom: data.range?.from ?? null,
    customTo: data.range?.to ?? null,
    customNewUsers: data.range?.newUsers ?? null,
    customActiveUsers: data.range?.activeUsers ?? null,
  };
}