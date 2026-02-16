import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { addMediaInput, addPropertySchema, updatePropertySchema } from "../../validators/property.validators";
import z from "zod";

type Params = {
    id: string;
};

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

export async function deleteProperty(req: Request<Params>, res: Response) {
    try {
        const { id } = req.params;
        await prisma.property.delete({
            where: {
                id,
                userId: req.user?.id,
            },
        });
        return res.status(200).json({
            success: true,
            message: `Property with id ${id} deleted successfully`
        })
    } catch (error: any) {
        console.error(error);
        if (error.code === "P2025") {
            return res.status(404).json({
                message: "Property not found or not owned by user",
            });
        };
        return res.status(500).json({ message: "Interval server error" });
    }
}
//Get All Properties
export async function getAllProperties(req: Request, res: Response) {
    try {
        const page = Number(req.query.page ?? 1);
        const limit = Number(req.query.limit ?? 10);
        const skip = (page - 1) * limit
        const [properties, total] = await Promise.all([
            prisma.property.findMany({
                where: { status: "ACTIVE" },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: { media: true },
            }),
            prisma.property.count({
                where: { status: "ACTIVE" },
            }),
        ]);
        return res.status(200).json({ data: properties, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internval server Error" })
    }
};

//get my properties
export async function getMyProperties(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" })
        };
        const properties = await prisma.property.findMany({
            where: { userId: userId },
            include: {
                media: true
            },
            orderBy: { createdAt: "desc" },
        });
        if (properties.length === 0) {
            return res.status(200).json({
                data: [],
                message: "No properties found",
            });
        }
        return res.status(200).json({ data: properties });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Interval server error" })
    }
}

//get specific properties
export async function getProperty(req: Request<Params>, res: Response) {
    try {
        const { id } = req.params;
        const property = await prisma.property.findUnique({
            where: { id },
            include: { media: true }
        });
        if (!property) {
            return res.status(404).json({ message: "No property found for the property id" })
        }
        return res.status(200).json({ data: property })

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Interval server error" })
    }
}

export async function updateProperty(req: Request<Params>, res: Response) {
    try {
        const { id } = req.params;
        type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
        const body = req.body as UpdatePropertyInput;
        const { ...propertyData } = body;
        const property = await prisma.property.update({
            where: {
                id,
                userId: req.user?.id
            },
            data: propertyData,
        });
        return res.status(200).json({
            success: true,
            data: property
        })

    } catch (error: any) {
        console.error(error);
        if (error.code === "P2025") {
            return res.status(404).json({
                message: "Property not found or not owned by user",
            });
        }
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

export async function addMedia(req: Request<Params>, res: Response) {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { id: propertyId } = req.params;
        const { media } = req.body as addMediaInput;
        const property = await prisma.property.findFirst({
            where: {
                id: propertyId,
                userId: req.user.id,
            },
            select: { id: true },
        });
        if (!property) {
            return res.status(404).json({
                message: "Property not found or not owned by user",
            });
        }
        const lastMedia = await prisma.propertyMedia.findFirst({
            where: { propertyId },
            orderBy: { order: "desc" },
            select: { order: true }
        })
        const startingOrder = lastMedia ? lastMedia.order + 1 : 0;
        await prisma.propertyMedia.createMany({
            data: media.map((m, index) => ({
                propertyId,
                url: m.url,
                key: m.key,
                mediaType: m.mediaType,
                order: startingOrder + index,
            })),
        });
        const updatedMedia = await prisma.propertyMedia.findMany({
            where: { propertyId },
            orderBy: { order: "asc" },
        });
        return res.status(201).json({
            success: true,
            data: updatedMedia,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Interval server error"
        })
    }
}

export async function deleteMedia(req: Request<Params>, res: Response) {
    try {
        const { id } = req.params;
        const media = await prisma.propertyMedia.findUnique({
            where: { id },
            include: {
                property: {
                    select: { id: true, userId: true },
                },
            },
        });

        if (!media) {
            return res.status(404).json({ message: "Media not found" });
        }

        if (media.property.userId !== req.user?.id) {
            return res.status(403).json({
                message: "You are not allowed to delete this media",
            });
        }

        const propertyId = media.property.id;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await prisma.$transaction(async (tx: any) => {
            await tx.propertyMedia.delete({
                where: { id: id },
            });
            const remainingMedia = await tx.propertyMedia.findMany({
                where: { propertyId },
                orderBy: { order: "asc" },
            });
            for (const [index, item] of remainingMedia.entries()) {
                await tx.propertyMedia.update({
                    where: { id: item.id },
                    data: { order: index },
                });
            }
        });

        return res.status(200).json({
            success: true,
            message: "Media deleted and reordered successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "interval server error" })
    }
};

export async function changeStatus(req:Request<Params>,res:Response){
    try{
        const userId = req.user?.id;
        if(!userId){
            return res.status(401).json({message:"Unauthorized User"})
        }
        const { id } = req.params;
        const { status } = req.body;
        
        if(!id || !status){
            return res.status(400).json({message:"Please provide property id and status"})
        }

        // Validate status value
        const validStatuses = ["ACTIVE", "UNLISTED", "SOLDOFFLINE", "SOLDTOREALBRO", "SOLDFROMLISTINGS", "DRAFT"];
        if(!validStatuses.includes(status)){
            return res.status(400).json({
                message:"Invalid status. Valid statuses are: ACTIVE, UNLISTED, SOLDOFFLINE, SOLDTOREALBRO, SOLDFROMLISTINGS, DRAFT"
            })
        }

        const property = await prisma.property.findUnique({
            where:{
                id,
                userId
            }
        });

        if(!property){
            return res.status(404).json({message:"Property not found or not owned by this user"})
        }

        // Update property status
        const updatedProperty = await prisma.property.update({
            where:{id, userId},
            data:{
                status
            },
            select:{
                id: true,
                title: true,
                status: true,
                updatedAt: true
            }
        });

        return res.status(200).json({
            success: true,
            message:`Property status updated successfully from ${property.status} to ${status}`,
            data: updatedProperty
        })

    }catch(error){
        console.error(error);
        return res.status(500).json({message:"Internal server error"})
    }
};


