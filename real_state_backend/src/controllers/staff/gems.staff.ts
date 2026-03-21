import { GemRequestStatus, GemRequestType, GemTxnReason } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { verifyOtp, createOtp, sendOtpEmail } from "../../services/otp.service";
import { creditAndCreateTransactions } from "../../services/gems.service";
import { createAndSendUserNotification } from "../../services/notification.service";
import {
    gemRequestApprovalNotification,
    gemRequestNotification,
    gemRequestRejectionNotification,
} from "../../services/Notifications/gems.notification";
import { resolveStaffActorId } from "./redeem.staff";

export async function previewGemAllocation(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const { userId, email, baseGems } = req.body as {
            userId?: string;
            email?: string;
            baseGems?: number;
        };

        if ((!userId && !email) || !baseGems || baseGems <= 0) {
            return res.status(400).json({ message: "userId or email and positive baseGems are required" });
        }

        const user = await prisma.user.findUnique({
            where: userId ? { id: userId } : { email: email as string },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                referrerId: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "Target user not found" });
        }

        let referralUser: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
        } | null = null;

        if (user.referrerId) {
            referralUser = await prisma.user.findUnique({
                where: { id: user.referrerId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                },
            });
        }

        const referralPercent = 5;
        const referralGems = referralUser ? Math.floor(baseGems * 0.05) : 0;
        const totalGems = baseGems + referralGems;

        return res.status(200).json({
            success: true,
            data: {
                baseGems,
                referralPercent,
                referralGems,
                totalGems,
                propertyId: null,
                targetUser: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                },
                referralUser,
            },
        });
    } catch (error) {
        console.error("Preview gem allocation error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function sendGemOtp(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const { userId, email } = req.body as { userId?: string; email?: string };
        if (!userId && !email) {
            return res.status(400).json({ message: "userId or email is required" });
        }

        const user = await prisma.user.findUnique({
            where: userId ? { id: userId } : { email: email as string },
            select: { id: true, email: true, firstName: true },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { code } = await createOtp(user.id, "GEM_TXN");
        await sendOtpEmail(user.email, code);

        return res.status(200).json({
            success: true,
            message: `OTP sent to ${user.email}`,
        });
    } catch (error) {
        console.error("Send gem OTP error:", error);
        return res.status(500).json({ message: "Internal server error" ,error});
    }
}

export async function giveAcquisitionRewardToUser(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        let actorStaffId = staffId;
        if (role === "SUPER_ADMIN") {
            const superAdmin = await prisma.superAdmin.findUnique({
                where: { id: staffId },
                select: {
                    email: true,
                    firstName: true,
                    lastName: true,
                    isActive: true,
                },
            });

            if (!superAdmin) {
                return res.status(401).json({ message: "Unauthorized" });
            }

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
                    update: {
                        role: "SUPER_ADMIN",
                        isActive: superAdmin.isActive,
                    },
                    create: {
                        email: superAdmin.email,
                        firstName: superAdmin.firstName ?? "Super",
                        lastName: superAdmin.lastName ?? "Admin",
                        role: "SUPER_ADMIN",
                        isActive: superAdmin.isActive,
                    },
                    select: { id: true },
                });
            }

            actorStaffId = requesterStaff.id;
        }

        const { userId, email, baseGems, otpCode, type, comment, propertyId } = req.body as {
            userId?: string;
            email?: string;
            baseGems?: number;
            otpCode?: string;
            type?: GemRequestType;
            comment?: string;
            propertyId?: string | null;
        };

        if ((!userId && !email) || !baseGems || baseGems <= 0 || !otpCode) {
            return res.status(400).json({ message: "userId or email, positive baseGems and otpCode are required" });
        }

        const requestType = type ?? "EXCLUSIVE_ACQUISITION_REWARD";
        if (!Object.values(GemRequestType).includes(requestType)) {
            return res.status(400).json({ message: "Invalid request type" });
        }
        if (requestType === "REDEMPTION") {
            return res.status(400).json({ message: "Use redemption API for redemption requests" });
        }

        const user = await prisma.user.findUnique({
            where: userId ? { id: userId } : { email: email as string },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                referrerId: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "Target user not found" });
        }

        const targetUserId = user.id;
        const otpResult = await verifyOtp(targetUserId, otpCode, "GEM_TXN");
        if (!otpResult.valid) {
            return res.status(400).json({ message: otpResult.message });
        }

        let referralUserId: string | null = null;
        if (user.referrerId) {
            const referralUser = await prisma.user.findUnique({
                where: { id: user.referrerId },
                select: { id: true },
            });
            if (referralUser) {
                referralUserId = referralUser.id;
            }
        }

        const referralPercent = 5;
        const referralGems = referralUserId ? Math.floor(baseGems * 0.05) : 0;
        const totalGems = baseGems + referralGems;

        let resolvedPropertyId: string | null = null;
        if (propertyId && typeof propertyId === "string" && propertyId.trim()) {
            const property = await prisma.property.findUnique({
                where: { id: propertyId.trim() },
                select: { id: true },
            });
            if (!property) {
                return res.status(400).json({ message: "Property not found" });
            }
            resolvedPropertyId = property.id;
        }

        if (role === "SUPER_ADMIN") {
            const request = await prisma.$transaction(async (tx) => {
                const createdRequest = await tx.gemRequest.create({
                    data: {
                        type: requestType,
                        status: "APPROVED",
                        requestedByStaffId: actorStaffId,
                        reviewedByStaffId: actorStaffId,
                        userId: targetUserId,
                        referralUserId,
                        propertyId: resolvedPropertyId,
                        baseGems,
                        referralPercent,
                        referralGems,
                        totalGems,
                        comment: comment ?? null,
                        otpVerifiedAt: new Date(),
                        otpVerifiedByStaffId: actorStaffId,
                    },
                });

                await creditAndCreateTransactions(tx, {
                    id: createdRequest.id,
                    type: requestType,
                    userId: targetUserId,
                    referralUserId,
                    baseGems,
                    referralGems,
                    requestedByStaffId: actorStaffId,
                    reason: requestType === "EXCLUSIVE_SALE_REWARD"
                        ? GemTxnReason.EXCLUSIVE_SALE_REWARD
                        : GemTxnReason.ACQUISITION_REWARD,
                    creditRefferee: true,
                });

                return tx.gemRequest.findUnique({
                    where: { id: createdRequest.id },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                            },
                        },
                        referralUser: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                            },
                        },
                        property: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                            },
                        },
                    },
                });
            });

            if (request) {
                const payload = gemRequestApprovalNotification({
                    userId: targetUserId,
                    approvedGems: baseGems,
                    propertyName: request.property?.title ?? null,
                    reason: requestType,
                });

                createAndSendUserNotification({
                    userId: targetUserId,
                    type: payload.type,
                    title: payload.title,
                    description: payload.description,
                    data: payload.data,
                }).catch((notificationError) => {
                    console.error("Gem approval notification error:", notificationError);
                });
            }

            return res.status(201).json({
                success: true,
                message: "Gems allocated successfully by super admin",
                data: request,
            });
        }

        const request = await prisma.gemRequest.create({
            data: {
                type: requestType,
                status: "PENDING_SUPERADMIN",
                requestedByStaffId: actorStaffId,
                userId: targetUserId,
                referralUserId,
                propertyId: resolvedPropertyId,
                baseGems,
                referralPercent,
                referralGems,
                totalGems,
                comment: comment ?? null,
                otpVerifiedAt: new Date(),
                otpVerifiedByStaffId: actorStaffId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
                referralUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                    },
                },
            },
        });

        const requestReceivedPayload = gemRequestNotification({
            userId: targetUserId,
            requestedGems: baseGems,
            propertyName: request.property?.title ?? null,
        });

        createAndSendUserNotification({
            userId: targetUserId,
            type: requestReceivedPayload.type,
            title: requestReceivedPayload.title,
            description: requestReceivedPayload.description,
            data: requestReceivedPayload.data,
        }).catch((notificationError) => {
            console.error("Gem request notification error:", notificationError);
        });

        return res.status(201).json({
            success: true,
            message: "Gem allocation request created and sent for super admin approval",
            data: request,
        });
    } catch (error) {
        console.error("Give gems request error:", error);
        return res.status(500).json({ message: "Internal server error" ,error});
    }
}

export async function gemRequests(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const page = Math.max(Number(req.query.page ?? 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 100);
        const skip = (page - 1) * limit;

        const status = req.query.status as GemRequestStatus | undefined;
        const type = req.query.type as GemRequestType | undefined;
        const userId = req.query.userId as string | undefined;
        const propertyId = req.query.propertyId as string | undefined;

        if (status && !Object.values(GemRequestStatus).includes(status)) {
            return res.status(400).json({ message: "Invalid status filter" });
        }
        if (type && !Object.values(GemRequestType).includes(type)) {
            return res.status(400).json({ message: "Invalid type filter" });
        }

        const where: any = {};
        if (status) where.status = status;
        if (type) where.type = type;
        if (userId) where.userId = userId;
        if (propertyId) where.propertyId = propertyId;

        // Super admin can see all gem requests. Other staff can see only their own.
        if (role !== "SUPER_ADMIN") {
            where.requestedByStaffId = staffId;
        }

        const [requests, total] = await Promise.all([
            prisma.gemRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        },
                    },
                    referralUser: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        },
                    },
                    property: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                        },
                    },
                    requestedByStaff: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            }),
            prisma.gemRequest.count({ where }),
        ]);

        return res.status(200).json({
            success: true,
            data: requests,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get gem requests error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function approveGemRequest(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!["SUPER_ADMIN"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const { requestId,decision } = req.body as { requestId: string, decision: "APPROVED" | "REJECTED" };
        if (decision !== "APPROVED" && decision !== "REJECTED") {
            return res.status(400).json({ message: "Invalid decision" });
        }
        const request = await prisma.gemRequest.findUnique({
            where: { id: requestId },
            select: {
                id: true,
                status: true,
                type: true,
                userId: true,
                referralUserId: true,
                baseGems: true,
                referralGems: true,
                property: {
                    select: {
                        title: true,
                    },
                },
            },
        });
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.type === "REDEMPTION") {
            return res.status(400).json({ message: "Use approve-redeem-request for redemption requests" });
        }

        if (request.status !== "PENDING_SUPERADMIN") {
            return res.status(400).json({ message: "Request is not pending super admin approval" });
        }

        if (decision === "APPROVED") {
            const actorStaffId = await resolveStaffActorId(staffId, role);
            await prisma.$transaction(async (tx) => {
                await tx.gemRequest.update({
                    where: { id: requestId },
                    data: { status: "APPROVED" },
                });
                await creditAndCreateTransactions(tx, {
                    id: requestId,
                    type: request.type,
                    userId: request.userId,
                    referralUserId: request.referralUserId,
                    baseGems: request.baseGems,
                    referralGems: request.referralGems,
                    requestedByStaffId: actorStaffId,
                    reason: request.type === "EXCLUSIVE_SALE_REWARD"
                        ? GemTxnReason.EXCLUSIVE_SALE_REWARD
                        : GemTxnReason.ACQUISITION_REWARD,
                    creditRefferee: true,
                });
            });

            const approvedGems = request.baseGems;
            const payload = gemRequestApprovalNotification({
                userId: request.userId,
                approvedGems,
                propertyName: request.property?.title ?? null,
                reason: request.type,
            });

            createAndSendUserNotification({
                userId: request.userId,
                type: payload.type,
                title: payload.title,
                description: payload.description,
                data: payload.data,
            }).catch((notificationError) => {
                console.error("Gem request approval notification error:", notificationError);
            });

            return res.status(200).json({
                success: true,
                message: "Request approved and gems credited successfully",
            });
        } else {
            await prisma.gemRequest.update({
                where: { id: requestId },
                data: { status: "REJECTED" },
            });

            const payload = gemRequestRejectionNotification({
                userId: request.userId,
                requestedGems: request.baseGems,
                propertyName: request.property?.title ?? null,
                reason: request.type,
            });

            createAndSendUserNotification({
                userId: request.userId,
                type: payload.type,
                title: payload.title,
                description: payload.description,
                data: payload.data,
            }).catch((notificationError) => {
                console.error("Gem request rejection notification error:", notificationError);
            });

            return res.status(200).json({
                success: true,
                message: "Request rejected successfully",
            });
        }
    } catch (error) {
        console.error("Approve gem request error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function rejectGemRequest(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!["ADMIN"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const { requestId } = req.body as { requestId: string };
        const request = await prisma.gemRequest.findUnique({
            where: { id: requestId },
            select: {
                id: true,
                status: true,
                type: true,
                userId: true,
                baseGems: true,
                property: {
                    select: {
                        title: true,
                    },
                },
            },
        });
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.status !== "PENDING_SUPERADMIN") {
            return res.status(400).json({ message: "Request is not pending super admin approval" });
        }
        const updatedRequest = await prisma.gemRequest.update({
            where: { id: requestId },
            data: { status: "REJECTED" },
        });

        if (request.type !== "REDEMPTION") {
            const payload = gemRequestRejectionNotification({
                userId: request.userId,
                requestedGems: request.baseGems,
                propertyName: request.property?.title ?? null,
                reason: request.type,
            });

            createAndSendUserNotification({
                userId: request.userId,
                type: payload.type,
                title: payload.title,
                description: payload.description,
                data: payload.data,
            }).catch((notificationError) => {
                console.error("Gem request rejection notification error:", notificationError);
            });
        }

        return res.status(200).json({
            success: true,
            message: "Request rejected successfully",
            data: updatedRequest,
        });

    } catch (error) {
        console.error("Reject gem request error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// export async function allotGemsToProperty(req: Request, res: Response) {
//     try{
//         const staffId = req.user?.id;
//         const role = req.user?.role;
//         if (!staffId || !role) {
//             return res.status(401).json({ message: "Unauthorized" });
//         }
//         if (!["SUPER_ADMIN"].includes(role)) {
//             return res.status(403).json({ message: "Forbidden" });
//         }
//         const { propertyId } = req.body as { propertyId: string };
//         const property = await prisma.property.findUnique({
//             where: { id: propertyId },
//             select: {
//                 id: true,
//                 status: true,
//             },
//         });
//         if (!property) {
//             return res.status(404).json({ message: "Property not found" });
//         }

//     }catch(error){
//         console.error("Allot gems to property error:", error);
//         return res.status(500).json({ message: "Internal server error" });
//     }
// }

export async function allGemTransactionHistory(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const page = Math.max(Number(req.query.page ?? 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 100);
        const skip = (page - 1) * limit;

        const date = req.query.date as string | undefined;
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;
        const reason = req.query.reason as string | undefined;
        const status = req.query.status as string | undefined;
        const amountMin = req.query.amountMin != null ? Number(req.query.amountMin) : undefined;
        const amountMax = req.query.amountMax != null ? Number(req.query.amountMax) : undefined;

        const createdAtFilter: { gte?: Date; lte?: Date } = {};
        if (date) {
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
                const start = new Date(d);
                start.setUTCHours(0, 0, 0, 0);
                const end = new Date(d);
                end.setUTCHours(23, 59, 59, 999);
                createdAtFilter.gte = start;
                createdAtFilter.lte = end;
            }
        } else if (startDate && endDate) {
            const s = new Date(startDate);
            const e = new Date(endDate);
            if (!isNaN(s.getTime())) {
                s.setUTCHours(0, 0, 0, 0);
                createdAtFilter.gte = s;
            }
            if (!isNaN(e.getTime())) {
                e.setUTCHours(23, 59, 59, 999);
                createdAtFilter.lte = e;
            }
        }

        const validReasons = ["ACQUISITION_REWARD", "EXCLUSIVE_SALE_REWARD", "REFERRAL_BONUS_5_PERCENT", "REDEMPTION", "GEM_REDEEM"];
        const statusToRequestStatus: Record<string, string> = {
            Completed: "APPROVED",
            Pending: "PENDING_SUPERADMIN",
            Rejected: "REJECTED",
        };

        const where: Record<string, unknown> = {};

        if (Object.keys(createdAtFilter).length > 0) {
            where.createdAt = createdAtFilter;
        }
        if (reason && validReasons.includes(reason)) {
            where.reason = reason;
        }
        if (status && statusToRequestStatus[status]) {
            where.request = { status: statusToRequestStatus[status] };
        }
        if (amountMin != null && !Number.isNaN(amountMin)) {
            where.amount = { ...(where.amount as Record<string, number> || {}), gte: amountMin };
        }
        if (amountMax != null && !Number.isNaN(amountMax)) {
            where.amount = { ...(where.amount as Record<string, number> || {}), lte: amountMax };
        }

        const [transactions, total] = await Promise.all([
            prisma.gemTransaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    reason: true,
                    amount: true,
                    createdAt: true,
                    txnType: true,
                    balanceBefore: true,
                    balanceAfter: true,
                    requestId: true,
                    request: {
                        select: {
                            propertyId: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    createdByStaff: {
                        select: {
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            }),
            prisma.gemTransaction.count({ where }),
        ]);

        const data = transactions.map((txn) => ({
            id: txn.id,
            userId: txn.user.id,
            user: `${txn.user.firstName} ${txn.user.lastName}`.trim(),
            reason: txn.reason,
            amount: txn.amount,
            createdAt: txn.createdAt,
            details: {
                txnType: txn.txnType,
                balanceBefore: txn.balanceBefore,
                balanceAfter: txn.balanceAfter,
            },
            staffHandler: txn.createdByStaff
                ? `${txn.createdByStaff.firstName} ${txn.createdByStaff.lastName}`.trim()
                : "SYSTEM",
            propertyId: txn.request?.propertyId ?? null,
        }));

        return res.status(200).json({
            success: true,
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("All gem transaction history error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getGemStats(req: Request, res: Response) {
    try {
        const role = req.user?.role;
        if (!req.user?.id || !role) return res.status(401).json({ message: "Unauthorized" });
        if (!["ADMIN", "SUPER_ADMIN"].includes(role)) return res.status(403).json({ message: "Forbidden" });

        const [
            redemptionResult,
            allocatedResult,
            referralResult,
            acquisitionResult,
            exclusiveSaleResult,
        ] = await Promise.all([
            prisma.gemTransaction.aggregate({
                where: { reason: "GEM_REDEEM" },
                _sum: { amount: true },
            }),
            prisma.gemTransaction.aggregate({
                where: { txnType: "CREDIT" },
                _sum: { amount: true },
            }),
            prisma.gemTransaction.aggregate({
                where: { reason: "REFERRAL_BONUS_5_PERCENT" },
                _sum: { amount: true },
            }),
            prisma.gemTransaction.aggregate({
                where: { reason: "ACQUISITION_REWARD" },
                _sum: { amount: true },
            }),
            prisma.gemTransaction.aggregate({
                where: { reason: "EXCLUSIVE_SALE_REWARD" },
                _sum: { amount: true },
            }),
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalGemRedemptionValue: redemptionResult._sum.amount ?? 0,
                totalGemsAllocated: allocatedResult._sum.amount ?? 0,
                totalReferralReward: referralResult._sum.amount ?? 0,
                totalAcquisitionReward: acquisitionResult._sum.amount ?? 0,
                totalExclusiveSaleReward: exclusiveSaleResult._sum.amount ?? 0,
            },
        });
    } catch (error) {
        console.error("Get gem stats error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getPendingTransactions(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!["ADMIN"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const pendingTransactions = await prisma.gemRequest.findMany({
            where: { status: "PENDING_SUPERADMIN" },
            select: {
                id: true,
                createdAt: true,
                type: true,
                requestedByStaff: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                referralUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        return res.status(200).json({ success: true, data: pendingTransactions });
    }
    catch (error) {
        console.error("Get pending transactions error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}