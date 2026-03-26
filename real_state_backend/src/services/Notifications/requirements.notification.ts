import { NotificationType, Prisma } from "@prisma/client";

const SUPPORT_EMAIL = "contact@realbro.io";
const SUPPORT_PHONE = "+91-80856-71414";

export function requirementFulfilledNotification(input: {
    userId: string;
    requirementId: string;
}): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    return {
        type: NotificationType.GENERIC,
        title: "Requirement Fulfilled",
        description: `Good news! Your property requirement has been fulfilled by our team. Reach us at Mail: '${SUPPORT_EMAIL}' | '${SUPPORT_PHONE}'.`,
        data: {
            action: "requirement_fulfilled",
            userId: input.userId,
            requirementId: input.requirementId,
            status: "FULFILLED",
            contactEmail: SUPPORT_EMAIL,
            contactPhone: SUPPORT_PHONE,
        },
    };
}

export function requirementClosedNotification(input: {
    userId: string;
    requirementId: string;
}): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    return {
        type: NotificationType.GENERIC,
        title: "Requirement Closed",
        description: `Your property requirement has been closed by our team. Reach us at Mail: '${SUPPORT_EMAIL}' | '${SUPPORT_PHONE}'.`,
        data: {
            action: "requirement_closed",
            userId: input.userId,
            requirementId: input.requirementId,
            status: "CLOSED",
            contactEmail: SUPPORT_EMAIL,
            contactPhone: SUPPORT_PHONE,
        },
    };
};