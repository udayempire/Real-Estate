import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { NotificationType } from "@prisma/client";
import { 
    CreateAppointmentInput, 
    UpdateAppointmentInput,
    GetAppointmentsQueryInput 
} from "../../validators/appointment.validators";
import { createAndSendUserNotification } from "../../services/notification.service";

type Params = {
    appointmentId: string;
};

// Create a new appointment
export async function createAppointment(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const { propertyId, appointmentDate, appointmentTime, notes, isPreBooked } = req.body as CreateAppointmentInput;

        // Check if property exists
        const property = await prisma.property.findUnique({
            where: { id: propertyId }
        });

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        // Create the appointment
        const appointment = await prisma.appointment.create({
            data: {
                userId,
                propertyId,
                appointmentDate: new Date(appointmentDate),
                appointmentTime,
                notes,
                isPreBooked: isPreBooked === "YES"
            },
            include: {
                property: {
                    include: {
                        media: {
                            orderBy: { order: 'asc' },
                            take: 1
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
                }
            }
        });

        try {
            await createAndSendUserNotification({
                userId,
                type: NotificationType.APPOINTMENT_CREATED,
                title: "Appointment booked",
                description: `Your appointment for ${property.title} has been scheduled successfully.`,
                data: {
                    appointmentId: appointment.id,
                    propertyId: appointment.propertyId,
                },
            });
        } catch (notificationError) {
            console.error("Appointment notification error:", notificationError);
        }

        return res.status(201).json({
            success: true,
            message: "Appointment created successfully",
            data: {
                ...appointment,
                isPreBooked: appointment.isPreBooked ? "YES" : "NO"
            }
        });
    } catch (error) {
        console.error("Create appointment error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Get all appointments for logged-in user
export async function getAppointments(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const query = req.query as unknown as GetAppointmentsQueryInput;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const { status, propertyId } = query;

        // Build where clause
        const where: any = { userId };
        if (status) {
            where.status = status;
        }
        if (propertyId) {
            where.propertyId = propertyId;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        const [appointments, total] = await Promise.all([
            prisma.appointment.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ appointmentDate: "asc" }],
                include: {
                    property: {
                        include: {
                            media: {
                                orderBy: { order: 'asc' },
                                take: 1
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
                    }
                }
            }),
            prisma.appointment.count({ where })
        ]);

        return res.status(200).json({
            success: true,
            data: appointments.map(apt => ({
                ...apt,
                isPreBooked: apt.isPreBooked ? "YES" : "NO"
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get appointments error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Get a single appointment by ID
export async function getAppointmentById(req: Request<Params>, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const { appointmentId } = req.params;

        const appointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                userId // Ensure user can only access their own appointments
            },
            include: {
                property: {
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
                }
            }
        });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        return res.status(200).json({
            success: true,
            data: {
                ...appointment,
                isPreBooked: appointment.isPreBooked ? "YES" : "NO"
            }
        });
    } catch (error) {
        console.error("Get appointment by ID error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Update an appointment
export async function updateAppointment(req: Request<Params>, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const { appointmentId } = req.params;
        const updateData = req.body as UpdateAppointmentInput;

        // Check if appointment exists and belongs to user
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                userId
            }
        });

        if (!existingAppointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Prepare update data
        const data: any = {};
        if (updateData.appointmentDate) {
            data.appointmentDate = new Date(updateData.appointmentDate);
        }
        if (updateData.appointmentTime) {
            data.appointmentTime = updateData.appointmentTime;
        }
        if (updateData.status) {
            data.status = updateData.status;
        }
        if (updateData.notes !== undefined) {
            data.notes = updateData.notes;
        }
        if (updateData.isPreBooked) {
            data.isPreBooked = updateData.isPreBooked === "YES";
        }

        // Update the appointment
        const appointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data,
            include: {
                property: {
                    include: {
                        media: {
                            orderBy: { order: 'asc' },
                            take: 1
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
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Appointment updated successfully",
            data: {
                ...appointment,
                isPreBooked: appointment.isPreBooked ? "YES" : "NO"
            }
        });
    } catch (error) {
        console.error("Update appointment error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Cancel an appointment
export async function cancelAppointment(req: Request<Params>, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const { appointmentId } = req.params;

        // Check if appointment exists and belongs to user
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                userId
            }
        });

        if (!existingAppointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Update appointment status to CANCELLED
        const appointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: "CANCELLED" },
            include: {
                property: {
                    include: {
                        media: {
                            orderBy: { order: 'asc' },
                            take: 1
                        }
                    }
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: "Appointment cancelled successfully",
            data: {
                ...appointment,
                isPreBooked: appointment.isPreBooked ? "YES" : "NO"
            }
        });
    } catch (error) {
        console.error("Cancel appointment error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Delete an appointment
export async function deleteAppointment(req: Request<Params>, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const { appointmentId } = req.params;

        // Check if appointment exists and belongs to user
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                userId
            }
        });

        if (!existingAppointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Delete the appointment
        await prisma.appointment.delete({
            where: { id: appointmentId }
        });

        return res.status(200).json({
            success: true,
            message: "Appointment deleted successfully"
        });
    } catch (error) {
        console.error("Delete appointment error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Get appointments for a specific property
export async function getPropertyAppointments(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const { propertyId } = req.params as { propertyId: string };
        const query = req.query as any;
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const status = query.status;

        // Check if property exists
        const property = await prisma.property.findUnique({
            where: { id: propertyId }
        });

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        // Build where clause
        const where: any = { propertyId, userId };
        if (status) {
            where.status = status;
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        const [appointments, total] = await Promise.all([
            prisma.appointment.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ appointmentDate: "asc" }]
            }),
            prisma.appointment.count({ where })
        ]);

        return res.status(200).json({
            success: true,
            data: appointments.map(apt => ({
                ...apt,
                isPreBooked: apt.isPreBooked ? "YES" : "NO"
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get property appointments error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Toggle isPreBooked status
export async function togglePreBooked(req: Request<Params>, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized User" });
        }

        const { appointmentId } = req.params;

        // Check if appointment exists and belongs to user
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                userId
            }
        });

        if (!existingAppointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Toggle the isPreBooked status
        const appointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { isPreBooked: !existingAppointment.isPreBooked },
            include: {
                property: {
                    include: {
                        media: {
                            orderBy: { order: 'asc' },
                            take: 1
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
                }
            }
        });

        return res.status(200).json({
            success: true,
            message: `Pre-booked status toggled to ${appointment.isPreBooked ? "YES" : "NO"}`,
            data: {
                ...appointment,
                isPreBooked: appointment.isPreBooked ? "YES" : "NO"
            }
        });
    } catch (error) {
        console.error("Toggle pre-booked error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
