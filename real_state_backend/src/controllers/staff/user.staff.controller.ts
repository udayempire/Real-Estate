import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
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
        return res.status(200).json({ users: userWithStats });
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
        const blockedBy = req.user?.id ?? null;
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

        return res.status(200).json({ message: "User blocked successfully" });
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
            select: { id: true },
        });
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const { firstName, lastName, age, gender, email, phone, isVerifiedSeller } = req.body as Partial<{
            firstName: string;
            lastName: string;
            age: number;
            gender: string;
            email: string;
            phone: string;
            isVerifiedSeller: boolean;
        }>;

        const data: Record<string, unknown> = {};
        if (firstName !== undefined) data.firstName = firstName;
        if (lastName !== undefined) data.lastName = lastName;
        if (age !== undefined) data.age = age;
        if (gender !== undefined) data.gender = gender;
        if (email !== undefined) data.email = email;
        if (phone !== undefined) data.phone = phone;
        if (isVerifiedSeller !== undefined) data.isVerifiedSeller = isVerifiedSeller;

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ message: "No fields provided to update" });
        }

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
            },
        });

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

        return res.status(200).json({ message: "KYC status updated", kyc: updated });
    } catch (error) {
        console.error("Update KYC status error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function fullUserDetails(req:Request, res:Response) {
    try{
        const {id} = req.params;
        if(!id){
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
                createdAt: true,
                updatedAt: true,
                kyc: {
                    select: {
                        type: true,
                        status: true,
                    }
                },
                properties:{
                    select:{
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
        if(!user){
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
    }catch(error){
        console.error("Full user details error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}