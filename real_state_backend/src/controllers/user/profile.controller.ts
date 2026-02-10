import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { hashPassword } from "../../utils/password";
import { Prisma } from "@prisma/client";

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
        return res.status(500).json({ message: "Internal server error" })
    }
}

export async function updateProfile(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        };
        const { firstName, lastName, email, password, phone } = req.body as Partial<{
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
            password: string;
        }>;

        const data: Record<string, unknown> = {};
        if (firstName !== undefined) data.firstName = firstName;
        if (lastName !== undefined) data.lastName = lastName;
        if (phone !== undefined) data.phone = phone;
        if (email !== undefined) {
            data.email = email;
            // If email changes, require re-verification.
            data.isEmailVerified = false;
        }
        if (password !== undefined) {
            data.password = await hashPassword(password);
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ message: "No fields provided to update" });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data,
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
                updatedAt: true,
            },
        })
        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error: unknown) {
        console.error("update profile:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                return res.status(409).json({
                    message: "Email or phone already in use",
                    meta: error.meta,
                });
            }
            // Record not found
            if (error.code === "P2025") {
                return res.status(404).json({ message: "User does not exist" });
            }
        }
        return res.status(500).json({ message: "Internal server error" })
    }
}