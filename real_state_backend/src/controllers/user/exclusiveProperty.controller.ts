import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import z from "zod";
import {
    filterExclusivePropertiesSchema,
    searchExclusivePropertiesSchema,
} from "../../validators/property.validators";

const exclusiveStatusValues = ["ACTIVE", "SOLD_OUT", "UNLISTED"] as const;
type ExclusiveStatus = (typeof exclusiveStatusValues)[number];
const prismaClient = prisma as any;

export async function getExclusivePropertiesForApp(req: Request, res: Response) {
    try {
        const page = Math.max(Number(req.query.page ?? 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 100);
        const skip = (page - 1) * limit;

        const rawStatus = String(req.query.status ?? "ACTIVE").toUpperCase();
        const status: ExclusiveStatus = exclusiveStatusValues.includes(rawStatus as ExclusiveStatus)
            ? (rawStatus as ExclusiveStatus)
            : "ACTIVE";

        const [items, total] = await Promise.all([
            prismaClient.exclusiveProperty.findMany({
                where: { status },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    listingPrice: true,
                    city: true,
                    locality: true,
                    subLocality: true,
                    numberOfRooms: true,
                    numberOfBathrooms: true,
                    numberOfBalcony: true,
                    numberOfFloors: true,
                    furnishingStatus: true,
                    fixedRewardGems: true,
                    isExtraRewardOn: true,
                    createdAt: true,
                    updatedAt: true,
                    media: {
                        where: { mediaType: "IMAGE" },
                        orderBy: { order: "asc" },
                        take: 1,
                        select: { url: true },
                    },
                },
            }),
            prismaClient.exclusiveProperty.count({ where: { status } }),
        ]);

        const data = items.map((item: any) => ({
            id: item.id,
            title: item.title,
            status: item.status,
            listingPrice: item.listingPrice,
            city: item.city,
            locality: item.locality,
            subLocality: item.subLocality,
            numberOfRooms: item.numberOfRooms,
            numberOfBathrooms: item.numberOfBathrooms,
            numberOfBalcony: item.numberOfBalcony,
            numberOfFloors: item.numberOfFloors,
            furnishingStatus: item.furnishingStatus,
            fixedRewardGems: item.fixedRewardGems,
            isExtraRewardOn: item.isExtraRewardOn,
            imageUrl: item.media[0]?.url ?? null,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));

        return res.status(200).json({
            success: true,
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get exclusive properties for app error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getExclusivePropertyDetailsForApp(req: Request, res: Response) {
    try {
        const { exclusivePropertyId } = req.params as { exclusivePropertyId: string };
        if (!exclusivePropertyId) {
            return res.status(400).json({ message: "exclusivePropertyId is required" });
        }

        const exclusiveProperty = await prismaClient.exclusiveProperty.findFirst({
            where: {
                id: exclusivePropertyId,
                status: "ACTIVE",
            },
            select: {
                id: true,
                title: true,
                description: true,
                propertyType: true,
                status: true,
                listingPrice: true,
                priceMin: true,
                priceMax: true,
                state: true,
                city: true,
                locality: true,
                subLocality: true,
                flatNo: true,
                area: true,
                address: true,
                latitude: true,
                longitude: true,
                carpetArea: true,
                carpetAreaUnit: true,
                plotLandArea: true,
                plotLandAreaUnit: true,
                size: true,
                sizeUnit: true,
                category: true,
                furnishingStatus: true,
                availabilityStatus: true,
                ageOfProperty: true,
                numberOfRooms: true,
                numberOfBathrooms: true,
                numberOfBalcony: true,
                numberOfFloors: true,
                propertyFloor: true,
                allInclusivePrice: true,
                negotiablePrice: true,
                govtChargesTaxIncluded: true,
                propertyFacing: true,
                amenities: true,
                locationAdvantages: true,
                coveredParking: true,
                uncoveredParking: true,
                fixedRewardGems: true,
                isExtraRewardOn: true,
                soldOutAt: true,
                notes: true,
                createdAt: true,
                updatedAt: true,
                media: {
                    orderBy: { order: "asc" },
                },
            },
        });

        if (!exclusiveProperty) {
            return res.status(404).json({ message: "Exclusive property not found" });
        }

        return res.status(200).json({ success: true, data: exclusiveProperty });
    } catch (error) {
        console.error("Get exclusive property details for app error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function searchExclusivePropertiesForApp(req: Request, res: Response) {
    try {
        type SearchExclusiveInput = z.infer<typeof searchExclusivePropertiesSchema>;
        const searchParams = ((req as any).validatedQuery || req.query) as SearchExclusiveInput;

        const {
            query,
            status = ["ACTIVE"],
            state,
            city,
            locality,
            subLocality,
            area,
            sortBy = "created_desc",
            page = 1,
            limit = 10,
        } = searchParams;

        const skip = (page - 1) * limit;

        let orderBy: { createdAt?: "asc" | "desc"; listingPrice?: "asc" | "desc" } = { createdAt: "desc" };
        if (sortBy === "price_asc") orderBy = { listingPrice: "asc" };
        else if (sortBy === "price_desc") orderBy = { listingPrice: "desc" };
        else if (sortBy === "created_asc") orderBy = { createdAt: "asc" };

        const where: any = { status: { in: status } };

        if (state) where.state = { contains: state, mode: "insensitive" };
        if (city) where.city = { contains: city, mode: "insensitive" };
        if (locality) where.locality = { contains: locality, mode: "insensitive" };
        if (subLocality) where.subLocality = { contains: subLocality, mode: "insensitive" };
        if (area) where.area = { contains: area, mode: "insensitive" };

        if (query && query.trim()) {
            const text = query.trim();
            where.OR = [
                { title: { contains: text, mode: "insensitive" } },
                { state: { contains: text, mode: "insensitive" } },
                { city: { contains: text, mode: "insensitive" } },
                { locality: { contains: text, mode: "insensitive" } },
                { subLocality: { contains: text, mode: "insensitive" } },
                { area: { contains: text, mode: "insensitive" } },
                { address: { contains: text, mode: "insensitive" } },
            ];
        }

        const [items, total] = await Promise.all([
            prismaClient.exclusiveProperty.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    listingPrice: true,
                    city: true,
                    locality: true,
                    subLocality: true,
                    numberOfRooms: true,
                    numberOfBathrooms: true,
                    numberOfBalcony: true,
                    numberOfFloors: true,
                    furnishingStatus: true,
                    fixedRewardGems: true,
                    isExtraRewardOn: true,
                    createdAt: true,
                    updatedAt: true,
                    media: {
                        where: { mediaType: "IMAGE" },
                        orderBy: { order: "asc" },
                        take: 1,
                        select: { url: true },
                    },
                },
            }),
            prismaClient.exclusiveProperty.count({ where }),
        ]);

        const data = items.map((item: any) => ({
            id: item.id,
            title: item.title,
            status: item.status,
            listingPrice: item.listingPrice,
            city: item.city,
            locality: item.locality,
            subLocality: item.subLocality,
            numberOfRooms: item.numberOfRooms,
            numberOfBathrooms: item.numberOfBathrooms,
            numberOfBalcony: item.numberOfBalcony,
            numberOfFloors: item.numberOfFloors,
            furnishingStatus: item.furnishingStatus,
            fixedRewardGems: item.fixedRewardGems,
            isExtraRewardOn: item.isExtraRewardOn,
            imageUrl: item.media[0]?.url ?? null,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));

        return res.status(200).json({
            success: true,
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        console.error("Search exclusive properties for app error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function filterExclusivePropertiesForApp(req: Request, res: Response) {
    try {
        type FilterExclusiveInput = z.infer<typeof filterExclusivePropertiesSchema>;
        const filters = ((req as any).validatedQuery || req.query) as FilterExclusiveInput;

        const {
            status = ["ACTIVE"],
            category,
            propertyType,
            furnishingStatus,
            availabilityStatus,
            ageOfProperty,
            propertyFacing,
            priceMin,
            priceMax,
            carpetAreaMin,
            carpetAreaMax,
            carpetAreaUnit,
            state,
            city,
            locality,
            numberOfRooms,
            numberOfBathrooms,
            sortBy = "created_desc",
            page = 1,
            limit = 10,
        } = filters;

        const where: any = { status: { in: status } };

        if (category?.length) where.category = { in: category };
        if (propertyType?.length) where.propertyType = { in: propertyType };
        if (furnishingStatus?.length) where.furnishingStatus = { in: furnishingStatus };
        if (availabilityStatus?.length) where.availabilityStatus = { in: availabilityStatus };
        if (ageOfProperty?.length) where.ageOfProperty = { in: ageOfProperty };
        if (propertyFacing?.length) where.propertyFacing = { in: propertyFacing };

        if (priceMin !== undefined || priceMax !== undefined) {
            where.listingPrice = {};
            if (priceMin !== undefined) where.listingPrice.gte = priceMin;
            if (priceMax !== undefined) where.listingPrice.lte = priceMax;
        }

        if (carpetAreaMin !== undefined || carpetAreaMax !== undefined) {
            where.carpetArea = {};
            if (carpetAreaMin !== undefined) where.carpetArea.gte = carpetAreaMin;
            if (carpetAreaMax !== undefined) where.carpetArea.lte = carpetAreaMax;
        }
        if (carpetAreaUnit) where.carpetAreaUnit = carpetAreaUnit;

        if (state) where.state = { contains: state, mode: "insensitive" };
        if (city) where.city = { contains: city, mode: "insensitive" };
        if (locality) where.locality = { contains: locality, mode: "insensitive" };

        if (numberOfRooms !== undefined) where.numberOfRooms = { gte: numberOfRooms };
        if (numberOfBathrooms !== undefined) where.numberOfBathrooms = { gte: numberOfBathrooms };

        let orderBy: { createdAt?: "asc" | "desc"; listingPrice?: "asc" | "desc" } = { createdAt: "desc" };
        if (sortBy === "price_asc") orderBy = { listingPrice: "asc" };
        else if (sortBy === "price_desc") orderBy = { listingPrice: "desc" };
        else if (sortBy === "created_asc") orderBy = { createdAt: "asc" };

        const skip = (page - 1) * limit;

        const [items, totalCount] = await Promise.all([
            prismaClient.exclusiveProperty.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    media: {
                        orderBy: { order: "asc" },
                    },
                },
            }),
            prismaClient.exclusiveProperty.count({ where }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({
            success: true,
            data: items,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        console.error("Filter exclusive properties for app error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}