import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import z from "zod";
import { NotificationType } from "@prisma/client";
import { createExclusivePropertySchema, updateExclusivePropertySchema } from "../../validators/property.validators";
import { broadcastNotificationToAllUsers, createAndSendUserNotification } from "../../services/notification.service";
import { normalizeCategory } from "../../utils/propertyTaxonomy";
import { buildAcquisitionApprovalNotification, unlistPropertyNotification } from "../../services/Notifications/properties.notification";

async function resolveStaffActorId(staffId: string, role: string): Promise<string | null> {
    if (role !== "SUPER_ADMIN") {
        return staffId;
    }

    const superAdmin = await prisma.superAdmin.findUnique({
        where: { id: staffId },
        select: {
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
        },
    });

    if (!superAdmin) {
        return null;
    }

    let requesterStaff = await prisma.staff.findFirst({
        where: {
            OR: [
                { id: staffId },
                { email: superAdmin.email, role: "SUPER_ADMIN" },
            ],
        },
        select: { id: true },
    });

    if (!requesterStaff) {
        requesterStaff = await prisma.staff.upsert({
            where: { email: superAdmin.email },
            update: {
                role: "SUPER_ADMIN",
                isActive: superAdmin.isActive,
            },
            create: {
                email: superAdmin.email,
                firstName: superAdmin.firstName ?? "Super",
                lastName: superAdmin.lastName ?? "Admin",
                role: "SUPER_ADMIN",
                isActive: superAdmin.isActive,
            },
            select: { id: true },
        });
    }

    return requesterStaff.id;
}

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
        const actorStaffId = await resolveStaffActorId(staffId, role);
        if (!actorStaffId) {
            return res.status(401).json({ message: "Unauthorized" });
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
            data: { propertyId, staffId: actorStaffId },
            select: { id: true },
        });
        return res.status(200).json({ message: "Bookmark added successfully", data: bookmark });

    } catch (error) {
        console.error("Add bookmark error:", error);
        return res.status(500).json({ message: "Internal server error", error });
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
        const actorStaffId = await resolveStaffActorId(staffId, role);
        if (!actorStaffId) {
            return res.status(401).json({ message: "Unauthorized" });
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
            where: { staffId_propertyId: { staffId: actorStaffId, propertyId } },
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
        const actorStaffId = await resolveStaffActorId(staffId, role);
        if (!actorStaffId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const bookmarks = await prisma.staffPropertyBookmark.findMany({
            where: { staffId: actorStaffId },
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
        const existingRequest = await prisma.propertyAcquisitionRequest.findUnique({
            where: { propertyId },
        });
        if (role !== "SUPER_ADMIN") {
            if (existingRequest?.status === "PENDING") {
                return res.status(409).json({ message: "Property is already requested for property acquisition" });
            }
            await prisma.propertyAcquisitionRequest.create({
                data: {
                    propertyId,
                    requestedByStaffId: staffId,
                    status: "PENDING",
                }
            })
            return res.status(200).json({ message: "Acquisition requested successfully" });
        } else if (role === "SUPER_ADMIN") {
            const actorStaffId = await resolveStaffActorId(staffId, role);
            if (!actorStaffId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const result = await prisma.$transaction(async (tx) => {
                const acquisitionRequest = await tx.propertyAcquisitionRequest.upsert({
                    where: { propertyId },
                    update: {
                        status: "APPROVED",
                        requestedByStaffId: actorStaffId,
                    },
                    create: {
                        propertyId,
                        requestedByStaffId: actorStaffId,
                        status: "APPROVED",
                    },
                });

                const updatedProperty = await tx.property.update({
                    where: { id: propertyId },
                    data: { status: "SOLDTOREALBRO" },
                    select: { id: true, title: true, userId: true, status: true },
                });

                return { acquisitionRequest, updatedProperty };
            });

            res.status(200).json({
                message: "Acquisition approved and sold to Real Bro successfully",
                data: {
                    acquisitionRequest: result.acquisitionRequest,
                    property: result.updatedProperty,
                },
            });

            const payload = buildAcquisitionApprovalNotification({
                propertyId: result.updatedProperty.id,
                propertyTitle: result.updatedProperty.title,
            });

            createAndSendUserNotification({
                userId: result.updatedProperty.userId,
                type: payload.type,
                title: payload.title,
                description: payload.description,
                data: payload.data,
            }).catch((notificationError) => {
                console.error("Acquisition approval notification error:", notificationError);
            });

            return;
        } return;
    }
    catch (error) {
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
        if (decision === "APPROVED") {
            const updatedProperty = await prisma.property.update({
                where: { id: propertyId as string },
                data: { status: "SOLDTOREALBRO" },
                select: { id: true, title: true, userId: true },
            });

            const payload = buildAcquisitionApprovalNotification({
                propertyId: updatedProperty.id,
                propertyTitle: updatedProperty.title,
            });

            createAndSendUserNotification({
                userId: updatedProperty.userId,
                type: payload.type,
                title: payload.title,
                description: payload.description,
                data: payload.data,
            }).catch((notificationError) => {
                console.error("Acquisition approval notification error:", notificationError);
            });
        }
        if (decision === "REJECTED") {
            await prisma.propertyAcquisitionRequest.delete({
                where: { propertyId: propertyId as string },
            });
        }
        return res.status(200).json({ message: `Property acquisition request ${decision} successfully` });
    } catch (error) {
        console.error("Acquisition request approval error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export async function createExclusiveProperty(req: Request, res: Response) {
    try {
        const staffId = req.user?.id;
        const role = req.user?.role;
        if (!staffId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!["SUPER_ADMIN"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const { propertyId } = req.params as { propertyId: string };
        if (!propertyId) {
            return res.status(400).json({ message: "propertyId is required" });
        }

        type CreateExclusiveInput = z.infer<typeof createExclusivePropertySchema>;
        const body = req.body as CreateExclusiveInput;

        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                media: true,
                // Keep this select minimal to avoid selecting stale columns from old client/schema drift.
                exclusiveProperty: { select: { id: true } },
            },
        });
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }
        if (property.exclusiveProperty) {
            return res.status(400).json({ message: "Property is already converted to exclusive" });
        }

        const {
            media: bodyMedia,
            fixedRewardGems,
            isExtraRewardOn,
            ...bodyOverrides
        } = body;

        const baseData = {
            title: property.title,
            description: property.description,
            propertyType: property.propertyType,
            listingPrice: property.listingPrice,
            priceMin: property.priceMin,
            priceMax: property.priceMax,
            state: property.state,
            city: property.city,
            locality: property.locality,
            subLocality: property.subLocality,
            flatNo: property.flatNo,
            area: property.area,
            address: property.address,
            latitude: property.latitude,
            longitude: property.longitude,
            carpetArea: property.carpetArea,
            carpetAreaUnit: property.carpetAreaUnit,
            plotLandArea: property.plotLandArea,
            plotLandAreaUnit: property.plotLandAreaUnit,
            size: property.size,
            sizeUnit: property.sizeUnit,
            category: property.category,
            furnishingStatus: property.furnishingStatus,
            availabilityStatus: property.availabilityStatus,
            ageOfProperty: property.ageOfProperty,
            numberOfRooms: property.numberOfRooms,
            numberOfBathrooms: property.numberOfBathrooms,
            numberOfBalcony: property.numberOfBalcony,
            numberOfFloors: property.numberOfFloors,
            propertyFloor: property.propertyFloor,
            allInclusivePrice: property.allInclusivePrice,
            negotiablePrice: property.negotiablePrice,
            govtChargesTaxIncluded: property.govtChargesTaxIncluded,
            propertyFacing: property.propertyFacing,
            amenities: property.amenities,
            locationAdvantages: property.locationAdvantages,
            coveredParking: property.coveredParking,
            uncoveredParking: property.uncoveredParking,
        };

        const exclusiveData = {
            ...baseData,
            ...bodyOverrides,
            sourcePropertyId: propertyId,
            originalUserId: property.userId,
            fixedRewardGems,
            isExtraRewardOn,
            status: (bodyOverrides.status ?? "ACTIVE") as "ACTIVE" | "SOLD_OUT" | "UNLISTED",
        };

        const mediaToCreate =
            bodyMedia !== undefined
                ? bodyMedia
                : property.media.map((m, index) => ({
                    url: m.url,
                    key: m.key,
                    mediaType: m.mediaType,
                    order: m.order ?? index,
                }));

        const exclusiveProperty = await prisma.exclusiveProperty.create({
            data: {
                ...exclusiveData,
                media:
                    mediaToCreate.length > 0
                        ? {
                            createMany: {
                                data: mediaToCreate.map((m, index) => ({
                                    url: m.url,
                                    key: m.key,
                                    mediaType: m.mediaType,
                                    order: m.order ?? index,
                                })),
                            },
                        }
                        : undefined,
            },
            select: {
                id: true,
                title: true,
                status: true,
                fixedRewardGems: true,
                createdAt: true,
                updatedAt: true,
                sourceProperty: { select: { id: true, title: true, status: true } },
                originalUser: { select: { id: true, firstName: true, lastName: true, email: true } },
                media: true,
            },
        });

        const locationParts = [property.locality, property.city, property.state].filter(Boolean);
        const locationLabel = locationParts.length ? locationParts.join(", ") : "your city";

        // Send announcement in background so property conversion response stays fast.
        broadcastNotificationToAllUsers({
            type: NotificationType.EXCLUSIVE_PROPERTY_ADDED,
            title: "New Exclusive Property Added 🏡",
            description: `${exclusiveProperty.title} is now live in ${locationLabel}. Help sell it and earn gems!`,
            data: {
                exclusivePropertyId: exclusiveProperty.id,
                sourcePropertyId: property.id,
                title: exclusiveProperty.title,
                location: locationLabel,
            },
        }).catch((notificationError) => {
            console.error("Exclusive property broadcast notification error:", notificationError);
        });

        return res.status(201).json({
            success: true,
            message: "Property converted to exclusive successfully",
            data: exclusiveProperty,
        });
    } catch (error) {
        console.error("Create exclusive property error:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
}

export async function updateExclusiveProperty(req: Request, res: Response) {
    try {
        const role = req.user?.role;
        if (!req.user?.id || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!["SUPER_ADMIN"].includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const { exclusivePropertyId } = req.params as { exclusivePropertyId: string };
        if (!exclusivePropertyId) {
            return res.status(400).json({ message: "exclusivePropertyId is required" });
        }

        type UpdateExclusiveInput = z.infer<typeof updateExclusivePropertySchema>;
        const body = req.body as UpdateExclusiveInput;

        const { media: bodyMedia, ...updateData } = body;

        const existing = await prisma.exclusiveProperty.findUnique({
            where: { id: exclusivePropertyId },
            select: { id: true },
        });
        if (!existing) {
            return res.status(404).json({ message: "Exclusive property not found" });
        }

        if (bodyMedia !== undefined) {
            await prisma.exclusivePropertyMedia.deleteMany({
                where: { exclusivePropertyId },
            });
        }

        const exclusiveProperty = await prisma.exclusiveProperty.update({
            where: { id: exclusivePropertyId },
            data: {
                ...updateData,
                ...(bodyMedia !== undefined && bodyMedia.length > 0
                    ? {
                        media: {
                            createMany: {
                                data: bodyMedia.map((m, index) => ({
                                    url: m.url,
                                    key: m.key,
                                    mediaType: m.mediaType,
                                    order: m.order ?? index,
                                })),
                            },
                        },
                    }
                    : {}),
            },
            select: {
                id: true,
                title: true,
                status: true,
                fixedRewardGems: true,
                createdAt: true,
                updatedAt: true,
                sourceProperty: { select: { id: true, title: true, status: true } },
                originalUser: { select: { id: true, firstName: true, lastName: true, email: true } },
                media: true,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Exclusive property updated successfully",
            data: exclusiveProperty,
        });
    } catch (error) {
        console.error("Update exclusive property error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getPendingApprovalProperties(req: Request, res: Response) {
    try {
        if (!req.user?.id || !req.user?.role) return res.status(401).json({ message: "Unauthorized" });
        const page = Math.max(Number(req.query.page ?? 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 100);
        const skip = (page - 1) * limit;

        const formatFurnishing = (v?: string | null) => (v ? v.replace(/([a-z])([A-Z])/g, "$1 $2") : "N/A");
        const formatPostedDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
        const formatArea = (area?: string | null, carpetArea?: number | null, carpetAreaUnit?: string | null) => (area || (carpetArea != null ? `${carpetArea} ${carpetAreaUnit ?? ""}`.trim() : "N/A"));
        const formatLocation = (sub?: string | null, loc?: string | null, city?: string | null) => [sub, loc, city].filter(Boolean).join(", ") || "N/A";

        const filterWhere = buildPropertyWhereFromQuery(req.query as Record<string, unknown>);
        const baseWhere = {
            acquisitionRequests: { some: { status: "PENDING" } },
            ...filterWhere,
        };

        const [properties, total] = await Promise.all([
            prisma.property.findMany({
                where: baseWhere,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true, title: true, listingPrice: true, area: true, carpetArea: true, carpetAreaUnit: true,
                    numberOfRooms: true, numberOfBathrooms: true, numberOfBalcony: true, numberOfFloors: true,
                    furnishingStatus: true, status: true, createdAt: true, subLocality: true, locality: true, city: true,
                    media: { where: { mediaType: "IMAGE" }, orderBy: { order: "asc" }, take: 1, select: { url: true } },
                },
            }),
            prisma.property.count({ where: baseWhere }),
        ]);

        const data = properties.map((p) => ({
            id: p.id,
            title: p.title,
            location: formatLocation(p.subLocality, p.locality, p.city),
            price: p.listingPrice != null ? String(p.listingPrice) : "N/A",
            area: formatArea(p.area, p.carpetArea, p.carpetAreaUnit),
            bedrooms: p.numberOfRooms ?? 0,
            bathrooms: p.numberOfBathrooms ?? 0,
            balconies: p.numberOfBalcony ?? 0,
            floors: p.numberOfFloors ?? 0,
            furnishing: formatFurnishing(p.furnishingStatus),
            status: p.status,
            imageUrl: p.media[0]?.url ?? "/largeBuilding2.png",
            postedDate: formatPostedDate(p.createdAt),
        }));

        return res.status(200).json({ success: true, data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        console.error("Get pending approval properties error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getPendingExclusiveProperties(req: Request, res: Response) {
    try {
        if (!req.user?.id || !req.user?.role) return res.status(401).json({ message: "Unauthorized" });
        if (req.user.role !== "SUPER_ADMIN") return res.status(403).json({ message: "Forbidden" });

        const page = Math.max(Number(req.query.page ?? 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 100);
        const skip = (page - 1) * limit;

        const formatFurnishing = (v?: string | null) => (v ? v.replace(/([a-z])([A-Z])/g, "$1 $2") : "N/A");
        const formatPostedDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
        const formatArea = (area?: string | null, carpetArea?: number | null, carpetAreaUnit?: string | null) => (area || (carpetArea != null ? `${carpetArea} ${carpetAreaUnit ?? ""}`.trim() : "N/A"));
        const formatLocation = (sub?: string | null, loc?: string | null, city?: string | null) => [sub, loc, city].filter(Boolean).join(", ") || "N/A";

        const filterWhere = buildPropertyWhereFromQuery(req.query as Record<string, unknown>);
        const baseWhere = {
            acquisitionRequests: { some: { status: "APPROVED" } },
            exclusiveProperty: null,
            ...filterWhere,
        };

        const [properties, total] = await Promise.all([
            prisma.property.findMany({
                where: baseWhere,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true, title: true, listingPrice: true, area: true, carpetArea: true, carpetAreaUnit: true,
                    numberOfRooms: true, numberOfBathrooms: true, numberOfBalcony: true, numberOfFloors: true,
                    furnishingStatus: true, status: true, createdAt: true, subLocality: true, locality: true, city: true,
                    media: { where: { mediaType: "IMAGE" }, orderBy: { order: "asc" }, take: 1, select: { url: true } },
                },
            }),
            prisma.property.count({ where: baseWhere }),
        ]);

        const data = properties.map((p) => ({
            id: p.id,
            title: p.title,
            location: formatLocation(p.subLocality, p.locality, p.city),
            price: p.listingPrice != null ? String(p.listingPrice) : "N/A",
            area: formatArea(p.area, p.carpetArea, p.carpetAreaUnit),
            bedrooms: p.numberOfRooms ?? 0,
            bathrooms: p.numberOfBathrooms ?? 0,
            balconies: p.numberOfBalcony ?? 0,
            floors: p.numberOfFloors ?? 0,
            furnishing: formatFurnishing(p.furnishingStatus),
            status: p.status,
            imageUrl: p.media[0]?.url ?? "/largeBuilding2.png",
            postedDate: formatPostedDate(p.createdAt),
        }));

        return res.status(200).json({ success: true, data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
        console.error("Get pending exclusive properties error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

function buildPropertyWhereFromQuery(query: Record<string, unknown>) {
    const where: Record<string, unknown> = {};
    const category = normalizeCategory(query.category);
    const propertyType = String(query.propertyType ?? "").trim();
    const furnishingStatus = String(query.furnishingStatus ?? "").trim();
    const priceMin = Number(query.priceMin);
    const priceMax = Number(query.priceMax);
    const location = String(query.location ?? "").trim();

    if (category) {
        where.category = category;
    }
    if (propertyType) {
        where.propertyType = propertyType;
    }
    if (
        furnishingStatus &&
        ["FullyFurnished", "SemiFurnished", "Unfurnished", "FencedWired", "FertileLand", "OpenLand", "Cultivated"].includes(
            furnishingStatus
        )
    ) {
        where.furnishingStatus = furnishingStatus;
    }
    if (!Number.isNaN(priceMin) && priceMin > 0) {
        (where as { listingPrice?: object }).listingPrice = { ...((where as { listingPrice?: object }).listingPrice as object), gte: priceMin };
    }
    if (!Number.isNaN(priceMax) && priceMax > 0) {
        const lp = (where as { listingPrice?: object }).listingPrice;
        (where as { listingPrice?: object }).listingPrice = typeof lp === "object" && lp && "gte" in lp
            ? { ...lp, lte: priceMax }
            : { lte: priceMax };
    }
    if (location) {
        // Split location by comma (e.g. "Sector 22, Chandigarh" -> ["Sector 22", "Chandigarh"])
        // and match if any part matches city or locality for better results
        const parts = location
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p.length >= 2);
        const searchTerms = parts.length > 0 ? parts : [location];
        const orConditions: object[] = [];
        for (const term of searchTerms) {
            orConditions.push(
                { city: { contains: term, mode: "insensitive" as const } },
                { locality: { contains: term, mode: "insensitive" as const } },
                { subLocality: { contains: term, mode: "insensitive" as const } }
            );
        }
        (where as { OR?: object[] }).OR = orConditions;
    }
    return where;
}

export async function getAllProperties(req: Request, res: Response) {
    try {
        if (!req.user?.id || !req.user?.role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const page = Math.max(Number(req.query.page ?? 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 100);
        const skip = (page - 1) * limit;

        const filterWhere = buildPropertyWhereFromQuery(req.query as Record<string, unknown>);

        const formatFurnishing = (value?: string | null) => {
            if (!value) return "N/A";
            return value.replace(/([a-z])([A-Z])/g, "$1 $2");
        };

        const formatPostedDate = (date: Date) =>
            date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            });

        const formatArea = (area?: string | null, carpetArea?: number | null, carpetAreaUnit?: string | null) => {
            if (area) return area;
            if (carpetArea) return `${carpetArea} ${carpetAreaUnit ?? ""}`.trim();
            return "N/A";
        };

        const formatLocation = (subLocality?: string | null, locality?: string | null, city?: string | null) => {
            const parts = [subLocality, locality, city].filter(Boolean);
            return parts.length ? parts.join(", ") : "N/A";
        };

        const baseWhere = {
            exclusiveProperty: null,
            status: { in: ["ACTIVE", "UNLISTED", "DRAFT"] as const },
            ...filterWhere,
        };

        const [properties, total] = await Promise.all([
            prisma.property.findMany({
                where: baseWhere,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    listingPrice: true,
                    area: true,
                    carpetArea: true,
                    carpetAreaUnit: true,
                    numberOfRooms: true,
                    numberOfBathrooms: true,
                    numberOfBalcony: true,
                    numberOfFloors: true,
                    furnishingStatus: true,
                    status: true,
                    createdAt: true,
                    subLocality: true,
                    locality: true,
                    city: true,
                    media: {
                        where: { mediaType: "IMAGE" },
                        orderBy: { order: "asc" },
                        take: 1,
                        select: { url: true },
                    },
                },
            }),
            prisma.property.count({ where: baseWhere }),
        ]);

        const data = properties.map((property) => ({
            id: property.id,
            title: property.title,
            location: formatLocation(property.subLocality, property.locality, property.city),
            price: property.listingPrice != null ? String(property.listingPrice) : "N/A",
            area: formatArea(property.area, property.carpetArea, property.carpetAreaUnit),
            bedrooms: property.numberOfRooms ?? 0,
            bathrooms: property.numberOfBathrooms ?? 0,
            balconies: property.numberOfBalcony ?? 0,
            floors: property.numberOfFloors ?? 0,
            furnishing: formatFurnishing(property.furnishingStatus),
            status: property.status,
            imageUrl: property.media[0]?.url ?? "/largeBuilding2.png",
            postedDate: formatPostedDate(property.createdAt),
        }));

        return res.status(200).json({
            success: true,
            data,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Get all properties error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getAllExclusiveProperties(req: Request, res: Response) {
    try {
        if (!req.user?.id || !req.user?.role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const page = Math.max(Number(req.query.page ?? 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 100);
        const skip = (page - 1) * limit;
        const filterWhere = buildPropertyWhereFromQuery(req.query as Record<string, unknown>);
        const [exclusiveProperties, total] = await Promise.all([
            prisma.exclusiveProperty.findMany({
                where: Object.keys(filterWhere).length > 0 ? filterWhere : undefined,
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
                    createdAt: true,
                    fixedRewardGems: true,
                    media: true,
                    sourceProperty: { select: { id: true, title: true, status: true } },
                    originalUser: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                },
            }),
            prisma.exclusiveProperty.count({
                where: Object.keys(filterWhere).length > 0 ? filterWhere : undefined,
            }),
        ]);
        return res.status(200).json({
            success: true,
            data: exclusiveProperties,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error("Get all exclusive properties error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getProperty(req: Request, res: Response) {
    try {
        if (!req.user?.id || !req.user?.role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { propertyId } = req.params as { propertyId: string };
        if (!propertyId) {
            return res.status(400).json({ message: "propertyId is required" });
        }
        let property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                media: true,
                user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, avatarKey: true } },
                exclusiveProperty: { select: { id: true, status: true, fixedRewardGems: true } },
            },
        });
        if (!property) {
            const exclusive = await prisma.exclusiveProperty.findUnique({
                where: { id: propertyId },
                select: { sourcePropertyId: true },
            });
            if (exclusive) {
                property = await prisma.property.findUnique({
                    where: { id: exclusive.sourcePropertyId },
                    include: {
                        media: true,
                        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, avatarKey: true } },
                        exclusiveProperty: { select: { id: true, status: true, fixedRewardGems: true } },
                    },
                });
            }
        }
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }
        return res.status(200).json({ success: true, data: property });
    } catch (error) {
        console.error("Get property error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function updatePropertyStatus(req: Request, res: Response) {
    try {
        const role = req.user?.role;
        if (!req.user?.id || !role) return res.status(401).json({ message: "Unauthorized" });
        if (!["ADMIN", "SUPER_ADMIN"].includes(role)) return res.status(403).json({ message: "Forbidden" });

        const { propertyId } = req.params as { propertyId: string };
        const { status, target } = req.body as { status?: string; target?: "property" | "exclusive" };
        if (!propertyId || !status) return res.status(400).json({ message: "propertyId and status are required" });

        const validPropertyStatuses = ["ACTIVE", "UNLISTED", "SOLDOFFLINE", "SOLDTOREALBRO", "SOLDFROMLISTINGS", "DRAFT", "SOLDEXCLUSIVEPROPERTY"];
        const validExclusiveStatuses = ["ACTIVE", "SOLD_OUT", "UNLISTED"];

        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            select: {
                id: true,
                title: true,
                userId: true,
                exclusiveProperty: { select: { id: true } },
            },
        });
        if (!property) return res.status(404).json({ message: "Property not found" });

        if (target === "exclusive" && validExclusiveStatuses.includes(status) && property.exclusiveProperty) {
            await prisma.exclusiveProperty.update({
                where: { id: property.exclusiveProperty.id },
                data: { status: status as "ACTIVE" | "SOLD_OUT" | "UNLISTED" },
            });
            return res.status(200).json({ success: true, message: "Exclusive property status updated" });
        }
        if (validPropertyStatuses.includes(status)) {
            await prisma.property.update({ where: { id: propertyId }, data: { status: status as "ACTIVE" | "UNLISTED" | "SOLDOFFLINE" | "SOLDTOREALBRO" | "SOLDFROMLISTINGS" | "DRAFT" | "SOLDEXCLUSIVEPROPERTY" } });

            if (status === "UNLISTED") {
                const payload = unlistPropertyNotification({
                    propertyId: property.id,
                    propertyTitle: property.title,
                });

                createAndSendUserNotification({
                    userId: property.userId,
                    type: payload.type,
                    title: payload.title,
                    description: payload.description,
                    data: payload.data,
                }).catch((notificationError) => {
                    console.error("Unlist property notification error:", notificationError);
                });
            }

            return res.status(200).json({ success: true, message: "Property status updated" });
        }
        return res.status(400).json({ message: "Invalid status" });
    } catch (error) {
        console.error("Update property status error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getExclusiveProperty(req: Request, res: Response) {
    try {
        if (!req.user?.id || !req.user?.role) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { exclusivePropertyId } = req.params as { exclusivePropertyId: string };
        if (!exclusivePropertyId) {
            return res.status(400).json({ message: "exclusivePropertyId is required" });
        }
        const exclusiveProperty = await prisma.exclusiveProperty.findUnique({
            where: { id: exclusivePropertyId },
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
                media: true,
                sourceProperty: { include: { media: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
                originalUser: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            },
        });
        if (!exclusiveProperty) {
            return res.status(404).json({ message: "Exclusive property not found" });
        }
        return res.status(200).json({ success: true, data: exclusiveProperty });
    } catch (error) {
        console.error("Get exclusive property error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function deleteUserListingProperty(req: Request, res: Response) {
    try {
        const propertyId = req.params.propertyId;
        if (!propertyId) {
            return res.status(400).json({ message: "propertyId is required" });
        }
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            select: {
                id: true,
                status: true,
                exclusiveProperty: { select: { id: true } },
            },
        });
        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }
        if (property.exclusiveProperty) {
            return res.status(400).json({
                message: "Cannot delete property: it is an exclusive listing. Remove from exclusive listings first.",
            });
        }
        if (property.status === "SOLDTOREALBRO") {
            return res.status(400).json({
                message: "Cannot delete property: it has been sold to RealBro.",
            });
        }
        await prisma.property.delete({ where: { id: propertyId } });
        return res.status(200).json({ message: "Property deleted successfully" });
    } catch (error) {
        console.error("Delete user listing property error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
