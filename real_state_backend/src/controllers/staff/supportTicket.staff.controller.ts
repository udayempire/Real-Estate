import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { GetTicketsQueryInput } from "../../validators/support.validators";

export async function getSupportTickets(req: Request, res: Response) {
    try {
        const queryData = ((req as any).validatedQuery || req.query) as GetTicketsQueryInput;
        const { ticketStatus, page = 1, limit = 20 } = queryData;

        const where: any = {};
        
        if (ticketStatus) {
            where.ticketStatus = ticketStatus;
        }

        const skip = (page - 1) * limit;

        const [tickets, totalCount] = await Promise.all([
            prisma.customerSupport.findMany({
                where,
                orderBy: { createdAt: 'asc' },
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            phone: true,
                        }
                    }
                }
            }),
            prisma.customerSupport.count({ where })
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return res.status(200).json({
            success: true,
            data: tickets,
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
        console.error("Get all tickets error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function closeSupportTicket(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!id) {
            return res.status(400).json({ message: "Invalid ticket ID" });
        }
        const ticket = await prisma.customerSupport.findUnique({
            where: { id },
        });
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }
        await prisma.customerSupport.update({
            where: { id },
            data: { ticketStatus: "CLOSED" },
        });
        return res.status(200).json({
            success: true,
            message: "Ticket closed successfully",
            data: ticket,
        });
    } catch (error) {
        console.error("Close support ticket error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}