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

// export async function updateUser(req: Request, res: Response) {
//     try {
//         const { id } = req.params;
//         const { firstName, lastName,age, gender, email, phone, sponsorCode, isBlocked, blockedBy, blockedOn } = req.body;
//         await prisma.user.update({
//             where: { id: id as string },
//             data: { firstName, lastName, email, phone, isBlocked, blockedBy, blockedOn },
//         });
//     }

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