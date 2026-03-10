import { GemRequest, GemTxnReason, PrismaClient } from "@prisma/client";

type Tx = Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function creditAndCreateTransactions(tx: Tx, request: {
    id: string;
    type: GemRequest["type"];
    userId: string;
    referralUserId: string | null;
    baseGems: number;
    referralGems: number;
    requestedByStaffId: string;
    reason: GemTxnReason;
    creditRefferee: boolean;
}) {
    // 1) Credit target user
    const targetBefore = await tx.user.findUnique({
        where: { id: request.userId },
        select: { points: true },
    });
    if (!targetBefore) throw new Error("Target user not found");

    const targetAfter = await tx.user.update({
        where: { id: request.userId },
        data: { points: { increment: request.baseGems } },
        select: { points: true },
    });

    // 2) Create transaction row for target user
    await tx.gemTransaction.create({
        data: {
            userId: request.userId,
            requestId: request.id,
            txnType: "CREDIT",
            reason: request.reason,
            amount: request.baseGems,
            balanceBefore: targetBefore.points,
            balanceAfter: targetAfter.points,
            createdByStaffId: request.requestedByStaffId,
        },
    });

    // 3) Credit referrer + create transaction if present
    if (request.referralUserId && request.referralGems > 0) {
        const refBefore = await tx.user.findUnique({
            where: { id: request.referralUserId },
            select: { points: true },
        });
        if (!refBefore) throw new Error("Referral user not found");

        const refAfter = await tx.user.update({
            where: { id: request.referralUserId },
            data: { points: { increment: request.referralGems } },
            select: { points: true },
        });

        if (request.creditRefferee) {
            await tx.gemTransaction.create({
                data: {
                    userId: request.referralUserId,
                    requestId: request.id,
                    txnType: "CREDIT",
                    reason: GemTxnReason.REFERRAL_BONUS_5_PERCENT,
                    amount: request.referralGems,
                    balanceBefore: refBefore.points,
                    balanceAfter: refAfter.points,
                    createdByStaffId: request.requestedByStaffId,
                },
            })
        };
    }
}

export async function debitAndCreateTransaction(tx: Tx, request: {
    requestId: string;
    userId: string;
    amount: number;
    requestedByStaffId: string;
    reason: GemTxnReason;
}) {
    const userBefore = await tx.user.findUnique({
        where: { id: request.userId },
        select: { points: true },
    });
    if (!userBefore) throw new Error("User not found");
    if (userBefore.points < request.amount) throw new Error("Insufficient gems");

    const userAfter = await tx.user.update({
        where: { id: request.userId },
        data: { points: { decrement: request.amount } },
        select: { points: true },
    });

    await tx.gemTransaction.create({
        data: {
            userId: request.userId,
            requestId: request.requestId,
            txnType: "DEBIT",
            reason: request.reason,
            amount: request.amount,
            balanceBefore: userBefore.points,
            balanceAfter: userAfter.points,
            createdByStaffId: request.requestedByStaffId,
        },
    });
}