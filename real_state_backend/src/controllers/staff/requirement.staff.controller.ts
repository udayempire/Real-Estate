import { PropertyRequirementStatus } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../../config/prisma";

export async function getPropertyRequirements(req: Request, res: Response) {
    try {
        const page = Math.max(Number(req.query.page ?? 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);
        const skip = (page - 1) * limit;
        const statusParam = typeof req.query.status === "string" ? req.query.status : undefined;

        const where: { status?: PropertyRequirementStatus } = {};
        if (statusParam && Object.values(PropertyRequirementStatus).includes(statusParam as PropertyRequirementStatus)) {
            where.status = statusParam as PropertyRequirementStatus;
        }

        const [requirements, total] = await Promise.all([
            prisma.propertyRequirement.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                        },
                    },
                },
            }),
            prisma.propertyRequirement.count({ where }),
        ]);

        return res.status(200).json({
            success: true,
            data: requirements,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get property requirements error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateRequirementStatus(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id) {
            return res.status(400).json({ message: "Invalid requirement ID" });
        }
        const { status } = req.body as { status?: string };
        const validStatuses = ["FULFILLED", "CLOSED"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ message: "status must be FULFILLED or CLOSED" });
        }

        const requirement = await prisma.propertyRequirement.findUnique({
            where: { id },
        });
        if (!requirement) {
            return res.status(404).json({ message: "Requirement not found" });
        }

        const updated = await prisma.propertyRequirement.update({
            where: { id },
            data: { status: status as PropertyRequirementStatus },
        });
        return res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error("Update requirement status error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}