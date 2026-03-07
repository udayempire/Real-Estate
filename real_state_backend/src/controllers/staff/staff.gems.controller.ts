import { GemRequestStatus, GemRequestType, GemTxnReason } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { verifyOtp } from "../../services/otp.service";

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

        const { userId, baseGems, propertyId } = req.body as {
            userId?: string;
            baseGems?: number;
            propertyId?: string;
        };

        if (!userId || !baseGems || baseGems <= 0) {
            return res.status(400).json({ message: "userId and positive baseGems are required" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
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

        if (propertyId) {
            const property = await prisma.property.findUnique({
                where: { id: propertyId },
                select: { id: true },
            });
            if (!property) {
                return res.status(404).json({ message: "Property not found" });
            }
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
                propertyId: propertyId ?? null,
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

export async function giveGemsToUser(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const { userId, baseGems, propertyId, otpCode, type, comment } = req.body as {
            userId?: string;
            baseGems?: number;
            propertyId?: string;
            otpCode?: string;
            type?: GemRequestType;
            comment?: string;
        };

        if (!userId || !baseGems || baseGems <= 0 || !otpCode) {
            return res.status(400).json({ message: "userId, positive baseGems and otpCode are required" });
        }

        const requestType = type ?? "EXCLUSIVE_ACQUISITION_REWARD";
        if (!Object.values(GemRequestType).includes(requestType)) {
            return res.status(400).json({ message: "Invalid request type" });
        }
        if (requestType === "REDEMPTION") {
            return res.status(400).json({ message: "Use redemption API for redemption requests" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
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

        if (propertyId) {
            const property = await prisma.property.findUnique({
                where: { id: propertyId },
                select: { id: true },
            });
            if (!property) {
                return res.status(404).json({ message: "Property not found" });
            }
        }
        // use when we add otp 
        // const otpResult = await verifyOtp(userId, otpCode, "GEM_TXN");
        // if (!otpResult.valid) {
        //     return res.status(400).json({ message: otpResult.message });
        // }

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

        if (role === "SUPER_ADMIN") {
            const request = await prisma.$transaction(async (tx) => {
                const createdRequest = await tx.gemRequest.create({
                    data: {
                        type: requestType,
                        status: "APPROVED",
                        requestedByStaffId: staffId,
                        reviewedByStaffId: staffId,
                        userId,
                        referralUserId,
                        propertyId: propertyId ?? null,
                        baseGems,
                        referralPercent,
                        referralGems,
                        totalGems,
                        comment: comment ?? null,
                        otpVerifiedAt: new Date(),
                        otpVerifiedByStaffId: staffId,
                    },
                });

                const targetUserBefore = await tx.user.findUnique({
                    where: { id: userId },
                    select: { points: true },
                });
                if (!targetUserBefore) {
                    throw new Error("Target user not found during allocation");
                }

                const updatedTarget = await tx.user.update({
                    where: { id: userId },
                    data: { points: { increment: baseGems } },
                    select: { points: true },
                });

                await tx.gemTransaction.create({
                    data: {
                        userId,
                        requestId: createdRequest.id,
                        txnType: "CREDIT",
                        reason: requestType === "EXCLUSIVE_SALE_REWARD" ? GemTxnReason.EXCLUSIVE_SALE_REWARD : GemTxnReason.ACQUISITION_REWARD,
                        amount: baseGems,
                        balanceBefore: targetUserBefore.points,
                        balanceAfter: updatedTarget.points,
                        createdByStaffId: staffId,
                    },
                });

                if (referralUserId && referralGems > 0) {
                    const referralBefore = await tx.user.findUnique({
                        where: { id: referralUserId },
                        select: { points: true },
                    });
                    if (!referralBefore) {
                        throw new Error("Referral user not found during allocation");
                    }

                    const updatedReferral = await tx.user.update({
                        where: { id: referralUserId },
                        data: { points: { increment: referralGems } },
                        select: { points: true },
                    });

                    await tx.gemTransaction.create({
                        data: {
                            userId: referralUserId,
                            requestId: createdRequest.id,
                            txnType: "CREDIT",
                            reason: GemTxnReason.REFERRAL_BONUS_5_PERCENT,
                            amount: referralGems,
                            balanceBefore: referralBefore.points,
                            balanceAfter: updatedReferral.points,
                            createdByStaffId: staffId,
                        },
                    });
                }

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
                requestedByStaffId: staffId,
                userId,
                referralUserId,
                propertyId: propertyId ?? null,
                baseGems,
                referralPercent,
                referralGems,
                totalGems,
                comment: comment ?? null,
                otpVerifiedAt: new Date(),
                otpVerifiedByStaffId: staffId,
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

        return res.status(201).json({
            success: true,
            message: "Gem allocation request created and sent for super admin approval",
            data: request,
        });
    } catch (error) {
        console.error("Give gems request error:", error);
        return res.status(500).json({ message: "Internal server error" });
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
                    reviewedByStaff: {
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
            data: { status: "APPROVED" },
        });
        await prisma.property.update({
            where: { id: requestId },
            data: { status: "SOLDTOREALBRO" },
        });

        return res.status(200).json({
            success: true,
            message: "Request approved successfully",
            data: updatedRequest,
        });
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