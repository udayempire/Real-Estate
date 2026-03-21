import { NotificationType, Prisma } from "@prisma/client";

export function requriementsMatchedNotification(input: {
    userId: string;
    propertyTitle: string;
}): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    return {
        type: NotificationType.GENERIC,
        title: "New Property Matches Your Preferences! 🏡",
        description: `A new property '${input.propertyTitle}' matches your saved preferences. Check it out and start selling!`,  
        data: {
            action: "requirements_matched",
            userId: input.userId,
            propertyTitle: input.propertyTitle,
        },
    };
}

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
        description: `Good news! Your property requirement has been fulfilled by our team. Reach us at Mail: '${contactEmail}' | '${contactPhone}' `,
        data: {
            action: "requirement_fulfilled",
            userId: input.userId,
            requirementId: input.requirementId,
            status: "FULFILLED",
            contactEmail: "contact@realbro.io",
            contactPhone: "+91-80856-71414",
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
        description: `Your property requirement has been closed by our team. Reach us at Mail: '${contactEmail}' | '${contactPhone}'.`,
        data: {
            action: "requirement_closed",
            userId: input.userId,
            requirementId: input.requirementId,
            status: "CLOSED",
            contactEmail: "contact@realbro.io",
            contactPhone: "+91-80856-71414",
        },
    };
}