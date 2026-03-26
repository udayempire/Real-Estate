import { NotificationType, Prisma } from "@prisma/client";

export function gemRequestNotification(input: {
    userId: string;
    requestedGems: number;
    propertyName?: string | null;
    reason?: string | null;
}): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    const propertyName = input.propertyName ?? "N/A";
    const reasonLabel =
        input.reason === "EXCLUSIVE_SALE_REWARD"
            ? "exclusive property sale"
            : input.reason === "EXCLUSIVE_ACQUISITION_REWARD"
                ? "property acquisition"
                : "reward request";

    return {
        type: NotificationType.GENERIC,
        title: "Gem Reward Update 💎",
        description: `Your ${reasonLabel} request for ${input.requestedGems} gems under property '${propertyName}' has been received by Realbro and will be processed in 1-3 working days.`,
        data: {
            action: "gem_request_received",
            userId: input.userId,
            requestedGems: input.requestedGems,
            propertyName,
            reason: input.reason ?? null,
        },
    };
};

export function gemRequestApprovalNotification(input: {
    userId: string;
    approvedGems: number;
    propertyName?: string | null;
    reason?: string | null;
}): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    const propertyName = input.propertyName ?? "your property";
    const reasonLabel =
        input.reason === "EXCLUSIVE_SALE_REWARD"
            ? "exclusive property sale"
            : input.reason === "EXCLUSIVE_ACQUISITION_REWARD"
                ? "property acquisition"
                : "reward approval";

    return {
        type: NotificationType.GENERIC,
        title: `${input.approvedGems} Gems Credited! 💎`,
        description: `Congratulations! Your reward for ${reasonLabel} under property '${propertyName}' has been added to your account.`,
        data: {
            action: "gem_request_approved",
            userId: input.userId,
            approvedGems: input.approvedGems,
            propertyName,
            reason: input.reason ?? null,
        },
    };
};

export function referralRewardCreditNotification(input: {
    userId: string;
    referralGems: number;
    propertyName?: string | null;
    reason?: string | null;
}): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    const propertyName = input.propertyName ?? "your referred property";
    const reasonLabel =
        input.reason === "EXCLUSIVE_SALE_REWARD"
            ? "exclusive property sale"
            : input.reason === "EXCLUSIVE_ACQUISITION_REWARD"
                ? "property acquisition"
                : "reward credit";

    return {
        type: NotificationType.GENERIC,
        title: `${input.referralGems} Referral Gems Credited! ✨`,
        description: `You received ${input.referralGems} referral gems from ${reasonLabel} for '${propertyName}'.`,
        data: {
            action: "referral_reward_credited",
            userId: input.userId,
            referralGems: input.referralGems,
            propertyName,
            reason: input.reason ?? null,
        },
    };
};

export function gemRequestRejectionNotification(input: {
    userId: string;
    requestedGems: number;
    propertyName?: string | null;
    reason?: string | null;
}): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    const propertyName = input.propertyName ?? "your property";
    const reasonLabel =
        input.reason === "EXCLUSIVE_SALE_REWARD"
            ? "exclusive property sale"
            : input.reason === "EXCLUSIVE_ACQUISITION_REWARD"
                ? "property acquisition"
                : "reward request";

    return {
        type: NotificationType.GENERIC,
        title: `Gem Reward Update 💎`,
        description: `Your reward request for ${input.requestedGems} gems under property '${propertyName}' has been reviewed and unfortunately cannot be approved at this time. Reason: ${reasonLabel}. Contact support for more details.`,
        data: {
            action: "gem_request_rejected",
            userId: input.userId,
            requestedGems: input.requestedGems,
            propertyName,
            reason: input.reason ?? null,
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

export function gemRedeemRejectionNotification(input: {
    userId: string;
    redeemedGems: number;
    reason?: string | null;
}): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    const reasonLabel =
        input.reason === "INSUFFICIENT_GEMS"
            ? "You do not have enough gems to redeem."
            : input.reason === "REDEEM_POLICY_VIOLATION"
                ? "Your redeem request violates our redeem policy."
                : "Your redeem request cannot be processed at this time.";

    return {
        type: NotificationType.GENERIC,
        title: `Gem Redeem Update 💎`,
        description: `Your request to redeem ${input.redeemedGems} gems has been rejected. ${reasonLabel}`,
        data: {
            action: "gem_redeem_rejected",
            userId: input.userId,
            redeemedGems: input.redeemedGems,
            reason: input.reason ?? null,
        },
    };
};
