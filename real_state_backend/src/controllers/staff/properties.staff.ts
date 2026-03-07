import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
export async function addBookMark(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const { propertyId } = req.body as { propertyId: string };
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            select: { id: true },
        });
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }
        const bookmark = await prisma.staffPropertyBookmark.create({
            data: { propertyId, staffId },
            select: { id: true },
        });
        return res.status(200).json({ message: "Bookmark added successfully", data: bookmark });

    } catch (error) {
        console.error("Add bookmark error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export async function removeBookMark(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const { propertyId } = req.body as { propertyId: string };
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            select: { id: true },
        });
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }
        const bookmark = await prisma.staffPropertyBookmark.delete({
            where: { staffId_propertyId: { staffId, propertyId } },
            select: { id: true },
        });
        return res.status(200).json({ message: "Bookmark removed successfully", data: bookmark });
    } catch (error) {
        console.error("Remove bookmark error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export async function getBookMarks(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const bookmarks = await prisma.staffPropertyBookmark.findMany({
            where: { staffId },
            select: { id: true, property: { select: { id: true, title: true, status: true } } },
        });
        return res.status(200).json({ message: "Bookmarks fetched successfully", data: bookmarks });
    } catch (error) {
        console.error("Get bookmarks error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export async function acquisitionRequest(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const { propertyId } = req.body as { propertyId: string };
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            select: { id: true },
        });
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }
        if (role !== "SUPER_ADMIN") {
            await prisma.propertyAcquisitionRequest.create({
                data: {
                    propertyId,
                    requestedByStaffId: staffId,
                    status: "PENDING",
                }
            })
            return res.status(200).json({ message: "Acquisition requested successfully" });
        } else if (role === "SUPER_ADMIN") {
            const acquisitionRequest = await prisma.propertyAcquisitionRequest.update({
                where: { propertyId: propertyId },
                data: {
                    status: "APPROVED",
                }
            })
            return res.status(200).json({ message: "Acquisition Approved successfully", data: acquisitionRequest });
        }
    } catch (error) {
        console.error("Acquisition request error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


export async function acquisitionRequestApproval(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        };
        if (!["SUPER_ADMIN"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const { propertyId, decision } = req.body as { propertyId: string, decision: "APPROVED" | "REJECTED" };
        const propertyAcquisitionRequest = await prisma.propertyAcquisitionRequest.findUnique({
            where: { propertyId: propertyId as string },
        });
        if (!propertyAcquisitionRequest) {
            return res.status(404).json({ message: "Property acquisition request not found" });
        }
        if (decision !== "APPROVED" && decision !== "REJECTED") {
            return res.status(400).json({ message: "Invalid decision" });
        }
        await prisma.propertyAcquisitionRequest.update({
            where: { propertyId: propertyId as string },
            data: { status: decision },
        });
        return res.status(200).json({ message: `Property acquisition request ${decision} successfully` });
    } catch (error) {
        console.error("Acquisition request approval error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};