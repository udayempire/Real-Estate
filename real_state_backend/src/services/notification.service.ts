import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { sendPushToTokens } from "./firebase.service";

const USER_BATCH_SIZE = 500;
const TOKEN_BATCH_SIZE = 500;

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  data?: Prisma.InputJsonValue;
}) {
  return prisma.userNotification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      description: input.description,
      data: input.data,
    },
  });
}

export async function createAndSendUserNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  data?: Prisma.InputJsonValue;
}) {
  const notification = await createNotification(input);

  const activeTokens = await prisma.userDeviceToken.findMany({
    where: {
      userId: input.userId,
      isActive: true,
    },
    select: {
      id: true,
      token: true,
    },
  });

  if (!activeTokens.length) {
    return {
      notification,
      push: {
        pushed: false,
        reason: "no_tokens",
      },
    };
  }

  const pushResult = await sendPushToTokens({
    tokens: activeTokens.map((item: { token: string }) => item.token),
    title: input.title,
    body: input.description,
    data: {
      notificationId: notification.id,
      type: input.type,
      ...(input.data && typeof input.data === "object" && !Array.isArray(input.data) ? input.data : {}),
    },
  });

  if (pushResult.invalidTokens.length) {
    await prisma.userDeviceToken.updateMany({
      where: {
        token: {
          in: pushResult.invalidTokens,
        },
      },
      data: {
        isActive: false,
      },
    });
  }

  return {
    notification,
    push: pushResult,
  };
}

export async function broadcastNotificationToAllUsers(input: {
  type: NotificationType;
  title: string;
  description: string;
  data?: Prisma.InputJsonValue;
}) {
  let lastId: string | undefined;
  let totalUsersNotified = 0;
  let totalPushSuccess = 0;
  let totalPushFailure = 0;

  while (true) {
    const users = await prisma.user.findMany({
      take: USER_BATCH_SIZE,
      ...(lastId ? { skip: 1, cursor: { id: lastId } } : {}),
      orderBy: { id: "asc" },
      select: { id: true },
    });

    if (!users.length) {
      break;
    }

    const userIds = users.map((user) => user.id);
    totalUsersNotified += userIds.length;

    await prisma.userNotification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        description: input.description,
        data: input.data,
      })),
    });

    const tokens = await prisma.userDeviceToken.findMany({
      where: {
        userId: { in: userIds },
        isActive: true,
      },
      select: {
        token: true,
      },
    });

    if (tokens.length) {
      const tokenStrings: string[] = tokens.map((item: { token: string }) => item.token);
      const tokenBatches = chunkArray(
        tokenStrings,
        TOKEN_BATCH_SIZE
      );

      for (const tokenBatch of tokenBatches) {
        const pushResult = await sendPushToTokens({
          tokens: tokenBatch,
          title: input.title,
          body: input.description,
          data:
            input.data && typeof input.data === "object" && !Array.isArray(input.data)
              ? {
                  type: input.type,
                  ...input.data,
                }
              : { type: input.type },
        });

        totalPushSuccess += pushResult.successCount;
        totalPushFailure += pushResult.failureCount;

        if (pushResult.invalidTokens.length) {
          await prisma.userDeviceToken.updateMany({
            where: {
              token: {
                in: pushResult.invalidTokens,
              },
            },
            data: {
              isActive: false,
            },
          });
        }
      }
    }

    lastId = users[users.length - 1].id;

    if (users.length < USER_BATCH_SIZE) {
      break;
    }
  }

  return {
    totalUsersNotified,
    totalPushSuccess,
    totalPushFailure,
  };
}
