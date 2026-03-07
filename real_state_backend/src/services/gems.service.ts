import { GemRequest, GemTxnReason, PrismaClient } from "@prisma/client";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

function getPrimaryReason(type: GemRequest["type"]): GemTxnReason {
  if (type === "EXCLUSIVE_SALE_REWARD") return "EXCLUSIVE_SALE_REWARD";
  return "ACQUISITION_REWARD";
}

export async function creditAndCreateTransactions(tx: Tx, request: {
  id: string;
  type: GemRequest["type"];
  userId: string;
  referralUserId: string | null;
  baseGems: number;
  referralGems: number;
  requestedByStaffId: string;
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
      reason: getPrimaryReason(request.type),
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

    await tx.gemTransaction.create({
      data: {
        userId: request.referralUserId,
        requestId: request.id,
        txnType: "CREDIT",
        reason: "REFERRAL_BONUS_5_PERCENT",
        amount: request.referralGems,
        balanceBefore: refBefore.points,
        balanceAfter: refAfter.points,
        createdByStaffId: request.requestedByStaffId,
      },
    });
  }
}