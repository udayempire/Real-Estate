import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { CreateSupportTicketInput, GetTicketsQueryInput } from "../../validators/support.validators";
import { NotificationType } from "@prisma/client";
import { createAndSendUserNotification } from "../../services/notification.service";
import z from "zod";

type Params = {
    id: string;
};

// Create a new support ticket
export async function createSupportTicket(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const body = req.body as CreateSupportTicketInput;

        // Get user's email from the database
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, firstName: true, lastName: true }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const ticket = await prisma.customerSupport.create({
            data: {
                name: body.name,
                phoneNo: body.phoneNo,
                description: body.description,
                isRequestForCall: body.isRequestForCall,
                userId: userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });

        try {
            await createAndSendUserNotification({
                userId,
                type: NotificationType.SUPPORT_TICKET_CREATED,
                title: "Support request created",
                description: "Your support request has been received. Our team will contact you soon.",
                data: {
                    ticketId: ticket.id,
                },
            });
        } catch (notificationError) {
            console.error("Support notification error:", notificationError);
        }

        return res.status(201).json({
            success: true,
            message: "Support ticket created successfully",
            data: ticket
        });
    } catch (error) {
        console.error("Create support ticket error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Get all tickets for the logged-in user
export async function getMyTickets(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const queryData = ((req as any).validatedQuery || req.query) as GetTicketsQueryInput;
        const { ticketStatus, page = 1, limit = 10 } = queryData;

        const where: any = { userId };
        
        if (ticketStatus) {
            where.ticketStatus = ticketStatus;
        }

        const skip = (page - 1) * limit;

        const [tickets, totalCount] = await Promise.all([
            prisma.customerSupport.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
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
        console.error("Get my tickets error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Get a single ticket by ID
export async function getTicketById(req: Request<Params>, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const { id } = req.params;

        const ticket = await prisma.customerSupport.findFirst({
            where: {
                id,
                userId // Ensure user can only access their own tickets
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });

        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        return res.status(200).json({
            success: true,
            data: ticket
        });
    } catch (error) {
        console.error("Get ticket by ID error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Update ticket status (can be used by user to close their ticket)
export async function updateTicketStatus(req: Request<Params>, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const { id } = req.params;
        const { ticketStatus } = req.body;

        // Check if ticket exists and belongs to user
        const existingTicket = await prisma.customerSupport.findFirst({
            where: {
                id,
                userId
            }
        });

        if (!existingTicket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        const updatedTicket = await prisma.customerSupport.update({
            where: { id },
            data: { ticketStatus },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: `Ticket status updated to ${ticketStatus}`,
            data: updatedTicket
        });
    } catch (error) {
        console.error("Update ticket status error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Get all tickets (Admin only - you can add admin middleware later)
export async function getAllTickets(req: Request, res: Response) {
    try {
        const queryData = ((req as any).validatedQuery || req.query) as GetTicketsQueryInput;
        const { ticketStatus, page = 1, limit = 10 } = queryData;

        const where: any = {};
        
        if (ticketStatus) {
            where.ticketStatus = ticketStatus;
        }

        const skip = (page - 1) * limit;

        const [tickets, totalCount] = await Promise.all([
            prisma.customerSupport.findMany({
                where,
                orderBy: { createdAt: 'desc' },
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
