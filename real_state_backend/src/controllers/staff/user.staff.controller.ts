import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { sendAccountBlockedEmail } from "../../services/otp.service";
import { createAndSendUserNotification } from "../../services/notification.service";
import {
    BlueTickNotification,
    verificationNotification,
    updateUserProfiledNotification,
    accountBlockedNotification,
    adharVerificationRejectedNotification,
    panVerificationRejectedNotification,
} from "../../services/Notifications/user.notification";
export async function getAllUsers(req: Request, res: Response) {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                isBlocked: true,
                blockedBy: true,
                blockedOn: true,
                points: true,
                isEmailVerified: true,
                blueTick: true,
                isVerifiedSeller: true,
                createdAt: true,
                updatedAt: true,
                kyc: {
                    select: {
                        type: true,
                        status: true,
                    }
                },
                properties: {
                    select: {
                        id: true,
                        status: true,
                    }
                }
            }
        })
        const userWithStats = users.map((u) => {
            const total = u.properties.length;
            const active = u.properties.filter((p) => p.status === "ACTIVE").length;
            const unlisted = u.properties.filter((p) => p.status === "UNLISTED").length;
            const soldStatuses = ["SOLDOFFLINE", "SOLDTOREALBRO", "SOLDFROMLISTINGS"];
            const sold = u.properties.filter((p) =>
                soldStatuses.includes(p.status)
            ).length;
            return {
                ...u,
                propertyStats: {
                    total,
                    sold,
                    active,
                    unlisted,
                }
            }
        })
        const usersNotBlocked = userWithStats.filter((u) => !u.isBlocked);
        return res.status(200).json({ users: usersNotBlocked });
    } catch (error) {
        console.error("Get all users error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getAllBlockedUsers(req: Request, res: Response) {
    try {
        const users = await prisma.user.findMany({
            where: { isBlocked: true },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                isBlocked: true,
                blockedBy: true,
                blockedOn: true,
                points: true,
                isEmailVerified: true,
                blueTick: true,
                isVerifiedSeller: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return res.status(200).json({ users: users });
    } catch (error) {
        console.error("Get all blocked users error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

function getAllowedS3BaseUrls(): string[] {
    const bucket = process.env.AWS_S3_BUCKET;
    const region = process.env.AWS_REGION;
    const custom = process.env.S3_PUBLIC_BASE_URL?.replace(/\/+$/, "");
    const bases: string[] = [];
    if (custom) bases.push(custom);
    if (bucket && region) {
        bases.push(`https://${bucket}.s3.${region}.amazonaws.com`);
        bases.push(`https://${bucket}.s3.amazonaws.com`);
    }
    return bases;
}

export async function kycProxyDownload(req: Request, res: Response) {
    try {
        const url = typeof req.query.url === "string" ? req.query.url : "";
        const filename = typeof req.query.filename === "string" ? req.query.filename : "kyc-document";

        if (!url) {
            return res.status(400).json({ message: "Missing url query parameter" });
        }

        const allowedBases = getAllowedS3BaseUrls();
        const urlLower = url.toLowerCase();
        const isAllowed = allowedBases.some((base) => urlLower.startsWith(base.toLowerCase()));
        if (!isAllowed) {
            return res.status(403).json({ message: "URL not from allowed S3 storage" });
        }

        const resp = await fetch(url);
        if (!resp.ok) {
            return res.status(resp.status).json({ message: "Failed to fetch image from storage" });
        }

        const contentType = resp.headers.get("content-type") ?? "application/octet-stream";
        const buffer = Buffer.from(await resp.arrayBuffer());

        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.send(buffer);
    } catch (error) {
        console.error("KYC proxy download error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function deleteUser(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id) {
            return res.status(400).json({ message: "User id is required" });
        }

        const existingUser = await prisma.user.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        await prisma.user.delete({
            where: { id },
        });

        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function blockUser(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const staffId = req.user?.id;
        const role = req.user?.role;
        const blockedBy = req.user?.id ?? null;
        if (!id) {
            return res.status(400).json({ message: "User id is required" });
        }
        if (role === "SUPER_ADMIN") {
            const existingUser = await prisma.user.findUnique({
                where: { id },
                select: { id: true, isBlocked: true, email: true },
            });

            if (!existingUser) {
                return res.status(404).json({ message: "User not found" });
            }

            if (existingUser.isBlocked) {
                return res.status(200).json({ message: "User is already blocked" });
            }

            await prisma.user.update({
                where: { id },
                data: {
                    isBlocked: true,
                    blockedBy,
                    blockedOn: new Date(),
                },
            });

            await prisma.refreshToken.deleteMany({
                where: { userId: id },
            });

            try {
                await sendAccountBlockedEmail(existingUser.email);
            } catch (emailError) {
                console.error("Block user email error:", emailError);
            }

            const payload = accountBlockedNotification({ userId: existingUser.id });
            createAndSendUserNotification({
                userId: existingUser.id,
                type: payload.type,
                title: payload.title,
                description: payload.description,
                data: payload.data,
            }).catch((notificationError) => {
                console.error("Block user notification error:", notificationError);
            });

            return res.status(200).json({ message: "User blocked successfully" });
        } else if (role === "ADMIN") {
            await prisma.banRequest.create({
                data: {
                    userId: id,
                    banReqByStaffId: staffId as string,
                },
            });
            return res.status(200).json({ message: "Ban request sent successfully" });
        }
    } catch (error) {
        console.error("Block user error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function unblockUser(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id) {
            return res.status(400).json({ message: "User id is required" });
        }

        const existingUser = await prisma.user.findUnique({
            where: { id },
            select: { id: true, isBlocked: true },
        });

        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!existingUser.isBlocked) {
            return res.status(200).json({ message: "User is not blocked" });
        }

        await prisma.user.update({
            where: { id },
            data: {
                isBlocked: false,
                blockedBy: null,
                blockedOn: null,
            },
        });

        return res.status(200).json({ message: "User unblocked successfully" });
    } catch (error) {
        console.error("Unblock user error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function reviewBanRequest(req: Request, res: Response) {
    const { decision } = req.body as { decision: "APPROVED" | "REJECTED" };
    const role = req.user?.role;
    try {
        if (role !== "SUPER_ADMIN") {
            return res.status(403).json({ message: "Forbidden" });
        }
        const { requestId } = req.params;
        if (!requestId) {
            return res.status(400).json({ message: "Request id is required" });
        }
        const request = await prisma.banRequest.findUnique({
            where: { id: requestId as string },
            select: { id: true, status: true, userId: true },
        });
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        if (request.status !== "PENDING_SUPERADMIN") {
            return res.status(400).json({ message: "Request is not pending super admin approval" });
        }
        if (!decision || (decision !== "APPROVED" && decision !== "REJECTED")) {
            return res.status(400).json({ message: "Decision is required and must be APPROVED or REJECTED" });
        }
        if (decision === "APPROVED") {
            const staffId = req.user?.id ?? null;
            await prisma.$transaction([
                prisma.banRequest.update({
                    where: { id: requestId as string },
                    data: { status: decision },
                }),
                prisma.user.update({
                    where: { id: request.userId },
                    data: { isBlocked: true, blockedBy: staffId, blockedOn: new Date() },
                }),
                prisma.refreshToken.deleteMany({
                    where: { userId: request.userId },
                }),
            ]);

            try {
                const blockedUser = await prisma.user.findUnique({
                    where: { id: request.userId },
                    select: { email: true },
                });
                if (blockedUser?.email) {
                    await sendAccountBlockedEmail(blockedUser.email);
                }
            } catch (emailError) {
                console.error("Ban approval email error:", emailError);
            }

            const payload = accountBlockedNotification({ userId: request.userId });
            createAndSendUserNotification({
                userId: request.userId,
                type: payload.type,
                title: payload.title,
                description: payload.description,
                data: payload.data,
            }).catch((notificationError) => {
                console.error("Ban approval block notification error:", notificationError);
            });

            return res.status(200).json({ message: "Ban request approved and user blocked successfully" });
        } else if (decision === "REJECTED") {
            await prisma.banRequest.update({
                where: { id: requestId as string },
                data: { status: decision },
            });
            return res.status(200).json({ message: "Ban request reviewed successfully" });
        }
        return res.status(200).json({ message: "Ban request reviewed successfully" });
    } catch (error) {
        console.error("Review ban request error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getUserForEdit(req: Request, res: Response) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "User id is required" });
        }
        const user = await prisma.user.findUnique({
            where: { id: id as string },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatar: true,
                age: true,
                gender: true,
                referralCode: true,
                isVerifiedSeller: true,
                isBlocked: true,
                blueTick: true,
                kyc: {
                    select: {
                        id: true,
                        type: true,
                        docNo: true,
                        status: true,
                        imageUrl: true,
                    },
                },
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ user });
    } catch (error) {
        console.error("Get user for edit error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateUserByStaff(req: Request, res: Response) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "User id is required" });
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: id as string },
            select: { id: true, isVerifiedSeller: true, blueTick: true },
        });
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const { firstName, lastName, age, gender, email, phone, isVerifiedSeller, blueTick } = req.body as Partial<{
            firstName: string;
            lastName: string;
            age: number;
            gender: string;
            email: string;
            phone: string;
            isVerifiedSeller: boolean;
            blueTick: boolean;
        }>;

        const data: Record<string, unknown> = {};
        if (firstName !== undefined) data.firstName = firstName;
        if (lastName !== undefined) data.lastName = lastName;
        if (age !== undefined) data.age = age;
        if (gender !== undefined) data.gender = gender;
        if (email !== undefined) data.email = email;
        if (phone !== undefined) data.phone = phone;
        if (isVerifiedSeller !== undefined) data.isVerifiedSeller = isVerifiedSeller;
        if (blueTick !== undefined) data.blueTick = blueTick;
        if (Object.keys(data).length === 0) {
            return res.status(400).json({ message: "No fields provided to update" });
        }

        const hasProfileFieldChanges = [firstName, lastName, age, gender, email, phone].some(
            (value) => value !== undefined
        );

        const updatedUser = await prisma.user.update({
            where: { id: id as string },
            data,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                age: true,
                gender: true,
                isVerifiedSeller: true,
                blueTick: true,
            },
        });

        if (hasProfileFieldChanges) {
            const payload = updateUserProfiledNotification({ userId: updatedUser.id });
            createAndSendUserNotification({
                userId: updatedUser.id,
                type: payload.type,
                title: payload.title,
                description: payload.description,
                data: payload.data,
            }).catch((notificationError) => {
                console.error("Profile update notification error:", notificationError);
            });
        }

        if (!existingUser.isVerifiedSeller && updatedUser.isVerifiedSeller) {
            const payload = verificationNotification({ userId: updatedUser.id });
            createAndSendUserNotification({
                userId: updatedUser.id,
                type: payload.type,
                title: payload.title,
                description: payload.description,
                data: payload.data,
            }).catch((notificationError) => {
                console.error("Verified seller notification error:", notificationError);
            });
        }

        if (!existingUser.blueTick && updatedUser.blueTick) {
            const payload = BlueTickNotification({ userId: updatedUser.id });
            createAndSendUserNotification({
                userId: updatedUser.id,
                type: payload.type,
                title: payload.title,
                description: payload.description,
                data: payload.data,
            }).catch((notificationError) => {
                console.error("Blue tick notification error:", notificationError);
            });
        }

        return res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Update user by staff error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateKycStatus(req: Request, res: Response) {
    try {
        const { id, kycId } = req.params;
        if (!id || !kycId) {
            return res.status(400).json({ message: "User id and KYC id are required" });
        }

        const { status, rejectionReason } = req.body as {
            status: "PENDING" | "VERIFIED" | "REJECTED";
            rejectionReason?: string;
        };

        if (!status || !["PENDING", "VERIFIED", "REJECTED"].includes(status)) {
            return res.status(400).json({ message: "Invalid status. Must be PENDING, VERIFIED, or REJECTED" });
        }

        const kyc = await prisma.kyc.findFirst({
            where: { id: kycId as string, userId: id as string },
        });
        if (!kyc) {
            return res.status(404).json({ message: "KYC record not found" });
        }

        const updated = await prisma.kyc.update({
            where: { id: kycId as string },
            data: {
                status,
                rejectionReason: status === "REJECTED" ? (rejectionReason ?? null) : null,
            },
            select: {
                id: true,
                type: true,
                docNo: true,
                status: true,
                imageUrl: true,
            },
        });

        if (status === "REJECTED") {
            if (updated.type === "AADHARCARD") {
                const payload = adharVerificationRejectedNotification({ userId: id as string });
                createAndSendUserNotification({
                    userId: id as string,
                    type: payload.type,
                    title: payload.title,
                    description: payload.description,
                    data: payload.data,
                }).catch((notificationError) => {
                    console.error("Aadhaar rejection notification error:", notificationError);
                });
            }

            if (updated.type === "PANCARD") {
                const payload = panVerificationRejectedNotification({ userId: id as string });
                createAndSendUserNotification({
                    userId: id as string,
                    type: payload.type,
                    title: payload.title,
                    description: payload.description,
                    data: payload.data,
                }).catch((notificationError) => {
                    console.error("PAN rejection notification error:", notificationError);
                });
            }
        }

        return res.status(200).json({ message: "KYC status updated", kyc: updated });
    } catch (error) {
        console.error("Update KYC status error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function fullUserDetails(req: Request, res: Response) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "User id is required" });
        }
        const user = await prisma.user.findUnique({
            where: { id: id as string },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                avatarKey: true,
                age: true,
                gender: true,
                referralCode: true,
                referrerId: true,
                email: true,
                phone: true,
                isBlocked: true,
                blockedBy: true,
                blockedOn: true,
                points: true,
                isEmailVerified: true,
                blueTick: true,
                isVerifiedSeller: true,
                createdAt: true,
                updatedAt: true,
                kyc: {
                    select: {
                        type: true,
                        status: true,
                        imageUrl: true,
                    }
                },
                properties: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        listingPrice: true,
                        createdAt: true,
                        state: true,
                        city: true,
                        locality: true,
                        carpetArea: true,
                        carpetAreaUnit: true,
                        plotLandArea: true,
                        plotLandAreaUnit: true,
                        media: {
                            select: { url: true },
                            orderBy: { order: "asc" },
                            take: 1,
                        },
                    },
                    orderBy: { createdAt: "desc" },
                }
            }
        })
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const properties = user.properties;

        const totalPropertiesWorth = properties.reduce(
            (sum, p) => sum + (p.listingPrice ?? 0), 0
        );
        const soldToRealBroCount = properties.filter(
            (p) => p.status === "SOLDTOREALBRO"
        ).length;

        const userStats = {
            totalGems: user.points,
            totalProperties: properties.length,
            soldToRealBro: soldToRealBroCount,
            totalPropertiesWorth,
        };

        const grouped = {
            all: properties,
            active: properties.filter((p) => p.status === "ACTIVE"),
            unlisted: properties.filter((p) => p.status === "UNLISTED"),
            soldToRealBro: properties.filter((p) => p.status === "SOLDTOREALBRO"),
            soldFromExclusive: properties.filter(
                (p) => (p.status as string) === "SOLDEXCLUSIVEPROPERTY"
            ),
        };

        return res.status(200).json({
            user: {
                ...user,
                properties: undefined,
                userStats,
                properties_by_status: grouped,
            },
        });
    } catch (error) {
        console.error("Full user details error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getAllBanRequests(req: Request, res: Response) {
    try {
        const banRequests = await prisma.banRequest.findMany({
            where: { status: "PENDING_SUPERADMIN" },

            select: {
                id: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        isBlocked: true,
                        blockedBy: true,
                        blockedOn: true,
                        points: true,
                        isEmailVerified: true,
                        createdAt: true,
                        updatedAt: true,
                        kyc: {
                            select: {
                                type: true,
                                status: true,
                            }
                        },
                        properties: {
                            select: {
                                id: true,
                                status: true,
                            }
                        }
                    }
                },
                banReqByStaff: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            },
        });
        return res.status(200).json({ success: true, data: banRequests });
    } catch (error) {
        console.error("Get all ban requests error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}