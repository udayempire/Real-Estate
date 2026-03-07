import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import z from "zod";
import { createExclusivePropertySchema, updateExclusivePropertySchema } from "../../validators/property.validators";
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
            include: { media: true, exclusiveProperty: true },
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
            status: (bodyOverrides.status ?? "ACTIVE") as "ACTIVE" | "SOLD_OUT" | "ARCHIVED",
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
            include: {
                sourceProperty: { select: { id: true, title: true, status: true } },
                originalUser: { select: { id: true, firstName: true, lastName: true, email: true } },
                media: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Property converted to exclusive successfully",
            data: exclusiveProperty,
        });
    } catch (error) {
        console.error("Create exclusive property error:", error);
        return res.status(500).json({ message: "Internal server error" });
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
            include: { media: true },
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
            include: {
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
