import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { sendPushToTokens } from "./firebase.service";

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
    tokens: activeTokens.map((item) => item.token),
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
