import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { addMediaInput, addPropertySchema, updatePropertySchema, addDraftPropertySchema, updateDraftPropertySchema, filterPropertiesSchema, searchPropertiesSchema } from "../../validators/property.validators";
import z from "zod";

type Params = {
    id: string;
};

const STATUS_LIMIT = 10;
const TOTAL_PROPERTIES_LIMIT = 20;
const LIMITED_STATUSES = ["ACTIVE", "UNLISTED"] as const;
type LimitedStatus = (typeof LIMITED_STATUSES)[number];

function isLimitedStatus(status: string | undefined): status is LimitedStatus {
    return status === "ACTIVE" || status === "UNLISTED";
}

async function hasReachedStatusLimit(userId: string, status: LimitedStatus) {
    const count = await prisma.property.count({
        where: {
            userId,
            status,
        },
    });
    return count >= STATUS_LIMIT;
}

async function hasReachedTotalPropertyLimit(userId: string) {
    const totalCount = await prisma.property.count({
        where: { userId },
    });
    return totalCount >= TOTAL_PROPERTIES_LIMIT;
}

export async function addProperty(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(201).json("UnAuthorized User");
        }

        if (await hasReachedTotalPropertyLimit(userId)) {
            return res.status(400).json({
                message: `Cannot create more than ${TOTAL_PROPERTIES_LIMIT} properties per user.`,
            });
        }

        type AddPropertyInput = z.infer<typeof addPropertySchema>;
        const body = req.body as AddPropertyInput;
        const { media, ...propertyData } = body;

        if (isLimitedStatus(propertyData.status) && await hasReachedStatusLimit(userId, propertyData.status)) {
            return res.status(400).json({
                message: `Cannot create more than ${STATUS_LIMIT} ${propertyData.status} properties.`,
            });
        }

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

export async function addDraftProperty(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        if (await hasReachedTotalPropertyLimit(userId)) {
            return res.status(400).json({
                message: `Cannot create more than ${TOTAL_PROPERTIES_LIMIT} properties per user.`,
            });
        }
        
        type AddDraftPropertyInput = z.infer<typeof addDraftPropertySchema>;
        const body = req.body as AddDraftPropertyInput;
        const { media, ...propertyData } = body;
        
        // Create property with DRAFT status
        const property = await prisma.property.create({
            data: {
                ...propertyData,
                userId: userId,
                status: "DRAFT", // Always set status to DRAFT
                media: media && media.length > 0 ? {
                    createMany: {
                        data: media.map((m, index) => ({
                            ...m,
                            order: m.order ?? index
                        })),
                    },
                } : undefined,
            },
            include: {
                media: true
            },
        });
        
        return res.status(201).json({
            success: true,
            data: property,
            message: "Draft property saved successfully"
        });
    } catch (error) {
        console.error("Add draft property error", error);
        return res.status(500).json({ message: "Internal server Error" })
    }
}

export async function updateDraftProperty(req: Request<Params>, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }
        
        const { id } = req.params;
        type UpdateDraftPropertyInput = z.infer<typeof updateDraftPropertySchema>;
        const body = req.body as UpdateDraftPropertyInput;
        const { media, status, ...propertyData } = body;
        
        // Check if property exists and belongs to user
        const existingProperty = await prisma.property.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                media: {
                    orderBy: { order: "asc" }
                }
            }
        });
        
        if (!existingProperty) {
            return res.status(404).json({ 
                message: "Property not found or not owned by user" 
            });
        }
        
        const nextStatus = status ?? "DRAFT";

        if (
            isLimitedStatus(nextStatus) &&
            existingProperty.status !== nextStatus &&
            await hasReachedStatusLimit(userId, nextStatus)
        ) {
            return res.status(400).json({
                message: `Cannot set more than ${STATUS_LIMIT} properties as ${nextStatus}.`,
            });
        }

        // If publishing draft, validate it against full add-property requirements.
        if (nextStatus === "ACTIVE") {
            const mediaForValidation = media && media.length > 0
                ? media
                : existingProperty.media.map((m: { url: string; key: string; mediaType: "IMAGE" | "VIDEO"; order: number }) => ({
                    url: m.url,
                    key: m.key,
                    mediaType: m.mediaType,
                    order: m.order,
                }));

            const publishValidation = addPropertySchema.safeParse({
                ...existingProperty,
                ...propertyData,
                status: "ACTIVE",
                media: mediaForValidation,
            });

            if (!publishValidation.success) {
                return res.status(400).json({
                    error: "Validation failed",
                    message: "Draft cannot be published. Please complete all required property fields.",
                    details: publishValidation.error.flatten().fieldErrors,
                });
            }
        }

        // Update property details and status
        const property = await prisma.property.update({
            where: { id },
            data: {
                ...propertyData,
                status: nextStatus,
            },
            include: {
                media: true
            },
        });
        
        // Replace media only when non-empty media array is provided.
        // Empty/omitted media payload should not clear existing draft media.
        if (media && media.length > 0) {
            await prisma.propertyMedia.deleteMany({
                where: { propertyId: id }
            });

            await prisma.propertyMedia.createMany({
                data: media.map((m, index) => ({
                    ...m,
                    propertyId: id,
                    order: m.order ?? index
                })),
            });
        }
        
        // Fetch updated property with media
        const updatedProperty = await prisma.property.findUnique({
            where: { id },
            include: { media: true }
        });
        
        return res.status(200).json({
            success: true,
            data: updatedProperty,
            message: nextStatus === "ACTIVE"
                ? "Draft property published successfully"
                : "Draft property updated successfully"
        });
    } catch (error) {
        console.error("Update draft property error", error);
        return res.status(500).json({ message: "Internal server Error" })
    }
}

export async function deleteProperty(req: Request<Params>, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { id } = req.params;
        const property = await prisma.property.findFirst({
            where: {
                id,
                userId,
            },
            select: {
                id: true,
                status: true,
                exclusiveProperty: { select: { id: true } },
            },
        });

        if (!property) {
            return res.status(404).json({
                message: "Property not found or not owned by user",
            });
        }

        if (property.exclusiveProperty) {
            return res.status(409).json({
                message: "Cannot delete property: it is linked to an exclusive listing.",
            });
        }

        await prisma.property.delete({
            where: {
                id,
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
        }
        if (error.code === "P2003") {
            return res.status(409).json({
                message: "Cannot delete property due to related records. Remove dependent records first.",
            });
        }
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
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { id } = req.params;
        type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
        const body = req.body as UpdatePropertyInput;
        const { media, status, ...propertyData } = body;

        const existingProperty = await prisma.property.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                media: {
                    orderBy: { order: "asc" }
                }
            }
        });

        if (!existingProperty) {
            return res.status(404).json({
                message: "Property not found or not owned by user",
            });
        }

        let nextStatus = status;

        // If editing a draft through regular update endpoint and data is complete,
        // auto-publish to ACTIVE unless client explicitly sets another status.
        if (!nextStatus && existingProperty.status === "DRAFT") {
            const mediaForValidation = media !== undefined
                ? media
                : existingProperty.media.map((m: { url: string; key: string; mediaType: "IMAGE" | "VIDEO"; order: number }) => ({
                    url: m.url,
                    key: m.key,
                    mediaType: m.mediaType,
                    order: m.order,
                }));

            const publishValidation = addPropertySchema.safeParse({
                ...existingProperty,
                ...propertyData,
                status: "ACTIVE",
                media: mediaForValidation,
            });

            if (publishValidation.success) {
                nextStatus = "ACTIVE";
            }
        }

        if (
            isLimitedStatus(nextStatus) &&
            existingProperty.status !== nextStatus &&
            await hasReachedStatusLimit(userId, nextStatus)
        ) {
            return res.status(400).json({
                message: `Cannot set more than ${STATUS_LIMIT} properties as ${nextStatus}.`,
            });
        }

        const property = await prisma.property.update({
            where: {
                id
            },
            data: {
                ...propertyData,
                ...(nextStatus ? { status: nextStatus } : {}),
            },
        });

        // If media is provided, replace property media with the provided list.
        if (media !== undefined) {
            await prisma.propertyMedia.deleteMany({
                where: { propertyId: id }
            });

            if (media.length > 0) {
                await prisma.propertyMedia.createMany({
                    data: media.map((m, index) => ({
                        ...m,
                        propertyId: id,
                        order: m.order ?? index,
                    })),
                });
            }
        }

        const updatedProperty = await prisma.property.findUnique({
            where: { id },
            include: { media: true }
        });

        return res.status(200).json({
            success: true,
            data: updatedProperty ?? property
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

        if (
            isLimitedStatus(status) &&
            property.status !== status &&
            await hasReachedStatusLimit(userId, status)
        ) {
            return res.status(400).json({
                message: `Cannot set more than ${STATUS_LIMIT} properties as ${status}`,
            });
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

// Filter Properties
export async function filterProperties(req: Request, res: Response) {
    try {
        type FilterPropertiesInput = z.infer<typeof filterPropertiesSchema>;
        // Get validated query data from middleware
        const filters = ((req as any).validatedQuery || req.query) as FilterPropertiesInput;
        
        const {
            category,
            propertyType,
            furnishingStatus,
            priceMin,
            priceMax,
            state,
            city,
            locality,
            availabilityStatus,
            ageOfProperty,
            numberOfRooms,
            numberOfBathrooms,
            propertyFacing,
            carpetAreaMin,
            carpetAreaMax,
            carpetAreaUnit,
            sortBy = 'created_desc',
            page = 1,
            limit = 10,
        } = filters;

        // Build the where clause
        const where: any = {
            status: {
                in: ['ACTIVE'] // Only show active properties in filters
            }
        };

        // Category filter
        if (category && category.length > 0) {
            where.category = { in: category };
        }

        // Property Type filter
        if (propertyType && propertyType.length > 0) {
            where.propertyType = { in: propertyType };
        }

        // Furnishing Status filter
        if (furnishingStatus && furnishingStatus.length > 0) {
            where.furnishingStatus = { in: furnishingStatus };
        }

        // Price Range filter
        if (priceMin !== undefined || priceMax !== undefined) {
            where.listingPrice = {};
            if (priceMin !== undefined) {
                where.listingPrice.gte = priceMin;
            }
            if (priceMax !== undefined) {
                where.listingPrice.lte = priceMax;
            }
        }

        // Location filters
        if (state) {
            where.state = { contains: state, mode: 'insensitive' };
        }
        if (city) {
            where.city = { contains: city, mode: 'insensitive' };
        }
        if (locality) {
            where.locality = { contains: locality, mode: 'insensitive' };
        }

        // Availability Status filter
        if (availabilityStatus && availabilityStatus.length > 0) {
            where.availabilityStatus = { in: availabilityStatus };
        }

        // Age of Property filter
        if (ageOfProperty && ageOfProperty.length > 0) {
            where.ageOfProperty = { in: ageOfProperty };
        }

        // Number of Rooms filter
        if (numberOfRooms !== undefined) {
            where.numberOfRooms = { gte: numberOfRooms };
        }

        // Number of Bathrooms filter
        if (numberOfBathrooms !== undefined) {
            where.numberOfBathrooms = { gte: numberOfBathrooms };
        }

        // Property Facing filter
        if (propertyFacing && propertyFacing.length > 0) {
            where.propertyFacing = { in: propertyFacing };
        }

        // Carpet Area filter
        if (carpetAreaMin !== undefined || carpetAreaMax !== undefined) {
            where.carpetArea = {};
            if (carpetAreaMin !== undefined) {
                where.carpetArea.gte = carpetAreaMin;
            }
            if (carpetAreaMax !== undefined) {
                where.carpetArea.lte = carpetAreaMax;
            }
        }
        if (carpetAreaUnit) {
            where.carpetAreaUnit = carpetAreaUnit;
        }

        // Sorting logic
        let orderBy: any = {};
        switch (sortBy) {
            case 'price_asc':
                orderBy = { listingPrice: 'asc' };
                break;
            case 'price_desc':
                orderBy = { listingPrice: 'desc' };
                break;
            case 'created_asc':
                orderBy = { createdAt: 'asc' };
                break;
            case 'created_desc':
            default:
                orderBy = { createdAt: 'desc' };
                break;
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Execute the query
        const [properties, totalCount] = await Promise.all([
            prisma.property.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    media: {
                        orderBy: { order: 'asc' }
                    },
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            avatar: true
                        }
                    }
                }
            }),
            prisma.property.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({
            success: true,
            data: properties,
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
        console.error("Filter properties error:", error);
        return res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
}

export async function searchProperties(req: Request, res: Response) {
    try {
        type SearchPropertiesInput = z.infer<typeof searchPropertiesSchema>;
        // Get validated query data from middleware
        const searchParams = ((req as any).validatedQuery || req.query) as SearchPropertiesInput;
        
        const {
            query,
            sortBy = 'created_desc',
            page = 1,
            limit = 10,
        } = searchParams;

        // Build the where clause - only ACTIVE properties
        const where: any = {
            status: 'ACTIVE' // Only show active properties
        };

        // If query parameter is provided, search across title and all location fields
        if (query && query.trim()) {
            where.OR = [
                { title: { contains: query.trim(), mode: 'insensitive' } },
                { state: { contains: query.trim(), mode: 'insensitive' } },
                { city: { contains: query.trim(), mode: 'insensitive' } },
                { locality: { contains: query.trim(), mode: 'insensitive' } },
                { subLocality: { contains: query.trim(), mode: 'insensitive' } },
                { area: { contains: query.trim(), mode: 'insensitive' } },
                { address: { contains: query.trim(), mode: 'insensitive' } }
            ];
        }

        // Sorting logic
        let orderBy: any = {};
        switch (sortBy) {
            case 'price_asc':
                orderBy = { listingPrice: 'asc' };
                break;
            case 'price_desc':
                orderBy = { listingPrice: 'desc' };
                break;
            case 'created_asc':
                orderBy = { createdAt: 'asc' };
                break;
            case 'created_desc':
            default:
                orderBy = { createdAt: 'desc' };
                break;
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Execute the query
        const [properties, totalCount] = await Promise.all([
            prisma.property.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    media: {
                        orderBy: { order: 'asc' }
                    },
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                            avatar: true
                        }
                    }
                }
            }),
            prisma.property.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({
            success: true,
            data: properties,
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
        console.error("Search properties error:", error);
        return res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
}
