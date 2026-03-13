import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { SavePropertyInput, GetSavedPropertiesQueryInput } from "../../validators/savedProperty.validators";

const prismaClient = prisma as any;

type Params = {
    propertyId: string;
};

// Save an exclusive property to user's favorites
export async function saveProperty(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const { propertyId: exclusivePropertyId } = req.body as SavePropertyInput;

        // Check if exclusive property exists
        const property = await prismaClient.exclusiveProperty.findUnique({
            where: { id: exclusivePropertyId }
        });

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        // Check if already saved
        const existingSave = await prismaClient.savedExclusiveProperty.findUnique({
            where: {
                userId_exclusivePropertyId: {
                    userId,
                    exclusivePropertyId
                }
            }
        });

        if (existingSave) {
            return res.status(400).json({ 
                message: "Property already saved",
                data: existingSave
            });
        }

        // Save the exclusive property
        const savedProperty = await prismaClient.savedExclusiveProperty.create({
            data: {
                userId,
                exclusivePropertyId
            },
            include: {
                exclusiveProperty: {
                    include: {
                        media: {
                            orderBy: { order: 'asc' }
                        }
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: "Property saved successfully",
            data: savedProperty
        });
    } catch (error) {
        console.error("Save property error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Remove a saved exclusive property
export async function unsaveProperty(req: Request<Params>, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const exclusivePropertyId = req.params.propertyId;

        // Check if property is saved
        const savedProperty = await prismaClient.savedExclusiveProperty.findUnique({
            where: {
                userId_exclusivePropertyId: {
                    userId,
                    exclusivePropertyId
                }
            }
        });

        if (!savedProperty) {
            return res.status(404).json({ message: "Saved property not found" });
        }

        // Remove the saved property
        await prismaClient.savedExclusiveProperty.delete({
            where: {
                userId_exclusivePropertyId: {
                    userId,
                    exclusivePropertyId
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Property removed from saved list"
        });
    } catch (error) {
        console.error("Unsave property error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Get all saved exclusive properties for the user
export async function getSavedProperties(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const queryData = ((req as any).validatedQuery || req.query) as GetSavedPropertiesQueryInput;
        const { page = 1, limit = 10 } = queryData;

        const skip = (page - 1) * limit;

        const [savedProperties, totalCount] = await Promise.all([
            prismaClient.savedExclusiveProperty.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    exclusiveProperty: {
                        include: {
                            media: {
                                orderBy: { order: 'asc' }
                            }
                        }
                    }
                }
            }),
            prismaClient.savedExclusiveProperty.count({ where: { userId } })
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({
            success: true,
            data: savedProperties,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });
    } catch (error) {
        console.error("Get saved properties error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Check if an exclusive property is saved by the user
export async function checkIfPropertySaved(req: Request<Params>, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const exclusivePropertyId = req.params.propertyId;

        const savedProperty = await prismaClient.savedExclusiveProperty.findUnique({
            where: {
                userId_exclusivePropertyId: {
                    userId,
                    exclusivePropertyId
                }
            }
        });

        return res.status(200).json({
            success: true,
            isSaved: !!savedProperty,
            data: savedProperty
        });
    } catch (error) {
        console.error("Check property saved error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
