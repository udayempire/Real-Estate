import { Request, Response } from "express";
import { prisma } from "../../config/prisma";

export async function createBanner(req: Request, res: Response) {
    try {
        const { title, image, imageKey } = req.body;
        const allBanners = await prisma.banner.findMany({
            where: { status: "ACTIVE" },
        })
        if (allBanners.length >= 4) {
            return res.status(400).json({ message: "You can only have up to 4 active banners" });
        }
        const banner = await prisma.banner.create({
            data: {
                title,
                image,
                imageKey,
            },
        });
        return res.status(200).json({ success: true, message: "Banner created successfully", data: banner });
    } catch (error) {
        console.error("Create banner error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getAllBanners(req: Request, res: Response) {
    try {
    const { status } = req.query;
    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }
    if (status === "ACTIVE") {
        const banners = await prisma.banner.findMany({
            where: { status: "ACTIVE" },
        });
        return res.status(200).json({ data: banners });
    }
    if (status === "INACTIVE") {
        const banners = await prisma.banner.findMany({
            where: { status: "INACTIVE" },
        });
        return res.status(200).json({ data: banners });
        }
    } catch (error) {
        console.error("Get all banners error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function deleteBanner(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const banner = await prisma.banner.delete({
            where: { id: id as string },
        });
        return res.status(200).json({ message: "Banner deleted successfully" });
    } catch (error) {
        console.error("Delete banner error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateBannerStatus(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { status } = req.body as { status?: "ACTIVE" | "INACTIVE" };
        if (!id) {
            return res.status(400).json({ message: "Banner id is required" });
        }
        if (status !== "ACTIVE" && status !== "INACTIVE") {
            return res.status(400).json({ message: "Invalid status. Use ACTIVE or INACTIVE" });
        }

        if (status === "ACTIVE") {
            const activeCount = await prisma.banner.count({ where: { status: "ACTIVE" } });
            if (activeCount >= 4) {
                return res.status(400).json({ message: "You can only have up to 4 active banners" });
            }
        }

        const banner = await prisma.banner.update({
            where: { id },
            data: { status },
        });

        return res.status(200).json({
            success: true,
            message: `Banner marked as ${status.toLowerCase()}`,
            data: banner,
        });
    } catch (error) {
        console.error("Update banner status error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}