import { Request, Response } from "express";
import { prisma } from "../../config/prisma";

export async function getProfile(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatar: true,
                referralCode: true,
                referrerId: true,
                points: true,
                isEmailVerified: true,
                createdAt: true,
            }
        })
        if (!user) {
            return res.status(404).json({ message: "User does not exist" });
        }
        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("Get Profile Error:", error);
        return res.status(500).json({message:"Internal server error"})
    }
}