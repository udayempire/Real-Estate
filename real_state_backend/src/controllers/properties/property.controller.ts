import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { addPropertySchema } from "../../validators/property.validators";
import z from "zod";

export async function addProperty(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(201).json("UnAuthorized User");
        }
        type AddPropertyInput = z.infer<typeof addPropertySchema>;
        const body = req.body as AddPropertyInput;
        const { media, ...propertyData } = body;
        const property = await prisma.property.create({
            data: {
                ...propertyData,
                userId: userId,
                media: {
                    createMany: {
                        data: media.map((m, index) => ({
                            ...m,
                            order: m.order ?? index
                        })),
                    },
                },
            },
            include: {
                media: true
            },
        });
        return res.status(201).json({
            success: true,
            data: property
        });
    } catch (error) {
        console.error("Add property error", error);
        return res.status(500).json({ message: "Internal server Error" })
    }
}