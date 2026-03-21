import { NotificationType, Prisma } from "@prisma/client";

export function verificationNotification(input: { userId: string }): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    return {
        type: NotificationType.USER_VERIFIED,
        title: "Verification Complete",
        description: "Your identity has been verified. Thanks for building trust in the Realbro community!",
        data: {
            action: "user_verified",
            userId: input.userId,
        },
    };
}

export function BlueTickNotification(input: { userId: string }): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    return {
        type: NotificationType.BLUE_TICK_EARNED,
        title: "Blue Tick Earned",
        description: "Congratulations! You've earned a blue tick for being a verified user.",
        data: {
            action: "blue_tick_earned",
            userId: input.userId,
        },
    };
}