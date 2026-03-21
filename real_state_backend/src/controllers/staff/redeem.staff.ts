import { GemRequestStatus, GemTxnReason } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { verifyOtp } from "../../services/otp.service";
import { debitAndCreateTransaction } from "../../services/gems.service";
import { createAndSendUserNotification } from "../../services/notification.service";
import {
    gemRedeemApprovalNotification,
    gemRedeemRequestNotification,
} from "../../services/Notifications/gems.notification";

export async function resolveStaffActorId(staffId: string, role: string): Promise<string> {
    if (role !== "SUPER_ADMIN") return staffId;

    const superAdmin = await prisma.superAdmin.findUnique({
        where: { id: staffId },
        select: { email: true, isActive: true },
    });
    if (!superAdmin) throw new Error("Unauthorized");

    let requesterStaff = await prisma.staff.findFirst({
        where: {
            OR: [
                { id: staffId },
                { email: superAdmin.email, role: "SUPER_ADMIN" },
            ],
        },
        select: { id: true },
    });

    if (!requesterStaff) {
        requesterStaff = await prisma.staff.upsert({
            where: { email: superAdmin.email },
            update: { role: "SUPER_ADMIN", isActive: superAdmin.isActive },
            create: {
                email: superAdmin.email,
                firstName: "Super",
                lastName: "Admin",
                role: "SUPER_ADMIN",
                isActive: superAdmin.isActive,
            },
            select: { id: true },
        });
    }
    return requesterStaff.id;
}

export async function createRedeemRequest(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) return res.status(401).json({ message: "Unauthorized" });
        if (!["ADMIN", "SUPER_ADMIN"].includes(role)) return res.status(403).json({ message: "Forbidden" });

        const actorStaffId = await resolveStaffActorId(staffId, role);

        const { userEmail, noOfGems, otp, type } = req.body as {
            userEmail?: string;
            noOfGems?: number;
            otp?: string;
            type?: string;
        };

        if (!userEmail?.trim() || !noOfGems || noOfGems <= 0 || !otp?.trim()) {
            return res.status(400).json({
                message: "userEmail, positive noOfGems and otp are required",
            });
        }
        if (type !== "GEM_REDEEM") {
            return res.status(400).json({ message: "type must be GEM_REDEEM" });
        }

        const user = await prisma.user.findUnique({
            where: { email: userEmail.trim() },
            select: { id: true, points: true, email: true },
        });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.points < noOfGems) {
            return res.status(400).json({ message: "Insufficient gems" });
        }

        const otpResult = await verifyOtp(user.id, otp.trim(), "GEM_TXN");
        if (!otpResult.valid) return res.status(400).json({ message: otpResult.message });

        const gemRequest = await prisma.gemRequest.create({
            data: {
                type: "REDEMPTION",
                status: "PENDING_SUPERADMIN",
                requestedByStaffId: actorStaffId,
                userId: user.id,
                baseGems: noOfGems,
                totalGems: noOfGems,
                referralGems: 0,
                otpVerifiedAt: new Date(),
                otpVerifiedByStaffId: actorStaffId,
            },
        });

        const requestPayload = gemRedeemRequestNotification({
            userId: user.id,
            redeemedGems: noOfGems,
        });

        createAndSendUserNotification({
            userId: user.id,
            type: requestPayload.type,
            title: requestPayload.title,
            description: requestPayload.description,
            data: requestPayload.data,
        }).catch((notificationError) => {
            console.error("Redeem request notification error:", notificationError);
        });

        return res.status(201).json({
            success: true,
            message: "Redemption request created and sent for super admin approval",
            data: gemRequest,
        });
    } catch (error) {
        console.error("Create redeem request error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getRedeemRequests(req: Request, res: Response) {
    try {
        const role = req.user?.role;
        if (!req.user?.id || !role) return res.status(401).json({ message: "Unauthorized" });
        if (!["ADMIN", "SUPER_ADMIN"].includes(role)) return res.status(403).json({ message: "Forbidden" });

        const page = Math.max(Number(req.query.page ?? 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 100);
        const skip = (page - 1) * limit;
        const status = req.query.status as string | undefined;

        const where: { type: "REDEMPTION"; status?: GemRequestStatus } = { type: "REDEMPTION" };
        if (status && Object.values(GemRequestStatus).includes(status as GemRequestStatus)) {
            where.status = status as GemRequestStatus;
        }

        const [requests, total] = await Promise.all([
            prisma.gemRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, email: true } },
                    requestedByStaff: { select: { id: true, firstName: true, lastName: true, email: true } },
                    reviewedByStaff: { select: { id: true, firstName: true, lastName: true } },
                },
            }),
            prisma.gemRequest.count({ where }),
        ]);

        return res.status(200).json({
            success: true,
            data: requests,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Get redeem requests error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function approveRedeemRequest(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) return res.status(401).json({ message: "Unauthorized" });
        if (role !== "SUPER_ADMIN") return res.status(403).json({ message: "Forbidden" });

        const actorStaffId = await resolveStaffActorId(staffId, role);

        const { requestId } = req.body as { requestId?: string };
        if (!requestId) return res.status(400).json({ message: "requestId is required" });

        const gemRequest = await prisma.gemRequest.findUnique({
            where: { id: requestId },
            select: { id: true, type: true, status: true, userId: true, baseGems: true },
        });
        if (!gemRequest) return res.status(404).json({ message: "Request not found" });
        if (gemRequest.type !== "REDEMPTION") return res.status(400).json({ message: "Not a redemption request" });
        if (gemRequest.status !== "PENDING_SUPERADMIN") {
            return res.status(400).json({ message: "Request is not pending approval" });
        }

        await prisma.$transaction(async (tx) => {
            await tx.gemRequest.update({
                where: { id: requestId },
                data: { status: "APPROVED", reviewedByStaffId: actorStaffId },
            });
            await debitAndCreateTransaction(tx, {
                requestId,
                userId: gemRequest.userId,
                amount: gemRequest.baseGems,
                requestedByStaffId: actorStaffId,
                reason: GemTxnReason.GEM_REDEEM,
            });
        });

        const approvalPayload = gemRedeemApprovalNotification({
            userId: gemRequest.userId,
            redeemedGems: gemRequest.baseGems,
        });

        createAndSendUserNotification({
            userId: gemRequest.userId,
            type: approvalPayload.type,
            title: approvalPayload.title,
            description: approvalPayload.description,
            data: approvalPayload.data,
        }).catch((notificationError) => {
            console.error("Redeem approval notification error:", notificationError);
        });

        return res.status(200).json({
            success: true,
            message: "Redemption approved and gems deducted successfully",
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Internal server error";
        if (msg === "Insufficient gems") return res.status(400).json({ message: msg });
        console.error("Approve redeem request error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function rejectRedeemRequest(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) return res.status(401).json({ message: "Unauthorized" });
        if (role !== "SUPER_ADMIN") return res.status(403).json({ message: "Forbidden" });

        const actorStaffId = await resolveStaffActorId(staffId, role);

        const { requestId } = req.body as { requestId?: string };
        if (!requestId) return res.status(400).json({ message: "requestId is required" });

        const gemRequest = await prisma.gemRequest.findUnique({
            where: { id: requestId },
            select: { id: true, type: true, status: true },
        });
        if (!gemRequest) return res.status(404).json({ message: "Request not found" });
        if (gemRequest.type !== "REDEMPTION") return res.status(400).json({ message: "Not a redemption request" });
        if (gemRequest.status !== "PENDING_SUPERADMIN") {
            return res.status(400).json({ message: "Request is not pending" });
        }

        await prisma.gemRequest.update({
            where: { id: requestId },
            data: { status: "REJECTED", reviewedByStaffId: actorStaffId },
        });

        return res.status(200).json({
            success: true,
            message: "Redemption request rejected successfully",
        });
    } catch (error) {
        console.error("Reject redeem request error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function directRedeemGems(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) return res.status(401).json({ message: "Unauthorized" });
        if (role !== "SUPER_ADMIN") return res.status(403).json({ message: "Forbidden" });

        const actorStaffId = await resolveStaffActorId(staffId, role);

        const { userEmail, noOfGems, otp, type } = req.body as {
            userEmail?: string;
            noOfGems?: number;
            otp?: string;
            type?: string;
        };

        if (!userEmail?.trim() || !noOfGems || noOfGems <= 0 || !otp?.trim()) {
            return res.status(400).json({
                message: "userEmail, positive noOfGems and otp are required",
            });
        }
        if (type !== "GEM_REDEEM") {
            return res.status(400).json({ message: "type must be GEM_REDEEM" });
        }

        const user = await prisma.user.findUnique({
            where: { email: userEmail.trim() },
            select: { id: true, points: true, email: true },
        });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.points < noOfGems) {
            return res.status(400).json({ message: "Insufficient gems" });
        }

        const otpResult = await verifyOtp(user.id, otp.trim(), "GEM_TXN");
        if (!otpResult.valid) return res.status(400).json({ message: otpResult.message });

        const result = await prisma.$transaction(async (tx) => {
            const gemRequest = await tx.gemRequest.create({
                data: {
                    type: "REDEMPTION",
                    status: "APPROVED",
                    requestedByStaffId: actorStaffId,
                    reviewedByStaffId: actorStaffId,
                    userId: user.id,
                    baseGems: noOfGems,
                    totalGems: noOfGems,
                    referralGems: 0,
                    otpVerifiedAt: new Date(),
                    otpVerifiedByStaffId: actorStaffId,
                },
            });
            await debitAndCreateTransaction(tx, {
                requestId: gemRequest.id,
                userId: user.id,
                amount: noOfGems,
                requestedByStaffId: actorStaffId,
                reason: GemTxnReason.GEM_REDEEM,
            });
            const updatedUser = await tx.user.findUnique({
                where: { id: user.id },
                select: { points: true },
            });

                    const approvalPayload = gemRedeemApprovalNotification({
            userId: gemRequest.userId,
            redeemedGems: gemRequest.baseGems,
        });

        createAndSendUserNotification({
            userId: gemRequest.userId,
            type: approvalPayload.type,
            title: approvalPayload.title,
            description: approvalPayload.description,
            data: approvalPayload.data,
        }).catch((notificationError) => {
            console.error("Redeem approval notification error:", notificationError);
        });
            return { balanceAfter: updatedUser?.points ?? 0 };

        });

        return res.status(200).json({
            success: true,
            message: "Gems redeemed successfully",
            data: { userBalanceAfter: result.balanceAfter },
        });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Internal server error";
        if (msg === "Insufficient gems") return res.status(400).json({ message: msg });
        console.error("Direct redeem gems error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
