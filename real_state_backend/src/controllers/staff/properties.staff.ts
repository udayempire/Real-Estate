import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
export function addBookMark(req: Request, res: Response) {
    try{
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
        const bookmark = await prisma.property.update({
            data: { propertyId, staffId },

    }catch(error){

    }
}