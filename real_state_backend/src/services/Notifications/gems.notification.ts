import { NotificationType, Prisma } from "@prisma/client";

export function gemRequestNotification(input: {
    userId: string;
    requestedGems: number;
    propertyName?: string | null;
}): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    const propertyName = input.propertyName ?? "N/A";

    return {
        type: NotificationType.GENERIC,
        title: "Gem Reward Update 💎",
        description: `Your reward request for ${input.requestedGems} gems under Property '${propertyName}' has been received by Realbro and will be processed in 1-3 working days.`,
        data: {
            action: "gem_request_received",
            userId: input.userId,
            requestedGems: input.requestedGems,
            propertyName,
        },
    };
};

export function gemRequestApprovalNotification(input: {
    userId: string;
    approvedGems: number;
    propertyName?: string | null;
}): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    const propertyName = input.propertyName ?? "your property";

    return {
        type: NotificationType.GENERIC,
        title: `${input.approvedGems} Gems Credited! 💎`,
        description: `Congratulations! Your reward for selling '${propertyName}' has been added to your account.`,
        data: {
            action: "gem_request_approved",
            userId: input.userId,
            approvedGems: input.approvedGems,
            propertyName,
        },
    };
};

export function gemRedeemRequestNotification(input: {   userId: string; redeemedGems: number; }): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    return {
        type: NotificationType.GENERIC,
        title: "Gem Redeem Request Received 💎",
        description: `Your request to redeem ${input.redeemedGems} gems has been received by Realbro and will be processed in 1-3 working days.`,
        data: {
            action: "gem_redeem_requested",
            userId: input.userId,
            redeemedGems: input.redeemedGems,
        },
    };
};

export function gemRedeemApprovalNotification(input: {
    userId: string;
    redeemedGems: number;
}): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    return {
        type: NotificationType.GENERIC,
        title: `Gem Redeem Update 💎`,
        description: `Your request to redeem ${input.redeemedGems} gems has been approved!`,
        data: {
            action: "gem_redeem_approved",
            userId: input.userId,
            redeemedGems: input.redeemedGems,
        },
    };
};


