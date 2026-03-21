import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { NotificationType, Prisma } from "@prisma/client";
import { createAndSendUserNotification } from "../../services/notification.service";

async function resolveStaffHandlerId(actorId: string, role: string): Promise<string | null> {
    if (role !== "SUPER_ADMIN") {
        const staff = await prisma.staff.findUnique({
            where: { id: actorId },
            select: { id: true },
        });
        return staff?.id ?? null;
    }

    const superAdmin = await prisma.superAdmin.findUnique({
        where: { id: actorId },
        select: { email: true, firstName: true, lastName: true, isActive: true },
    });

    if (!superAdmin) return null;

    let staffRecord = await prisma.staff.findFirst({
        where: {
            OR: [
                { id: actorId },
                { email: superAdmin.email, role: "SUPER_ADMIN" },
            ],
        },
        select: { id: true },
    });

    if (!staffRecord) {
        staffRecord = await prisma.staff.upsert({
            where: { email: superAdmin.email },
            update: { role: "SUPER_ADMIN", isActive: superAdmin.isActive },
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

    return staffRecord.id;
}

export async function getAllAppointments(req: Request, res: Response) {
    try {
        const { status } = req.query;
        const where: { status?: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "WAITING" } = {};
        const validStatuses = ["SCHEDULED", "COMPLETED", "CANCELLED", "WAITING"];
        if (typeof status === "string" && validStatuses.includes(status)) {
            where.status = status as (typeof validStatuses)[number];
        }

        const appointments = await prisma.appointment.findMany({
            where,
            orderBy: [{ appointmentDate: "asc" } as const],
            include: {
                property:{
                    select: {
                        id: true,
                        title: true,
                    }
                },
                user:{
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    }
                },
                staffHandler: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    }
                }
            }
        });
        return res.status(200).json({ appointments });
    } catch (error) {
        console.error("Get all appointments error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function acceptAppointment(req: Request, res: Response) {
    try {
        const appointmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const actorId = req.user?.id;
        const role = req.user?.role;

        if (!appointmentId) {
            return res.status(400).json({ message: "Invalid appointment ID" });
        }
        if (!actorId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const staffHandlerId = await resolveStaffHandlerId(actorId, role);
        if (!staffHandlerId) {
            return res.status(401).json({ message: "Could not resolve staff handler" });
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                property: { select: { title: true } },
                user: { select: { id: true, firstName: true, lastName: true } }
            }
        });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.status !== "SCHEDULED" && appointment.status !== "WAITING") {
            return res.status(400).json({ message: "Appointment cannot be accepted in current state" });
        }

        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: "WAITING", staffHandlerId },
            include: {
                property: { select: { id: true, title: true } },
                user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                staffHandler: { select: { id: true, firstName: true, lastName: true, role: true, email: true, phone: true } }
            }
        });

        try {
            const scheduledDate = new Date(appointment.appointmentDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
            const scheduledAt = `${scheduledDate} at ${appointment.appointmentTime}`;
            const handlerName = [updated.staffHandler?.firstName, updated.staffHandler?.lastName]
                .filter(Boolean)
                .join(" ") || "our support team";
            const contactValue = updated.staffHandler?.phone || updated.staffHandler?.email;
            const contactText = contactValue ? `${handlerName} (${contactValue})` : handlerName;

            await createAndSendUserNotification({
                userId: appointment.userId,
                type: NotificationType.APPOINTMENT_UPDATED,
                title: "Appointment accepted",
                description: `Your appointment for "${appointment.property.title}" has been scheduled for ${scheduledAt}. Contact: ${contactText}.`,
                data: {
                    appointmentId,
                    propertyId: appointment.propertyId,
                    appointmentDate: appointment.appointmentDate.toISOString(),
                    appointmentTime: appointment.appointmentTime,
                    contactName: handlerName,
                    contact: contactValue,
                }
            });
        } catch (e) {
            console.error("Appointment accept notification error:", e);
        }

        return res.status(200).json({ success: true, message: "Appointment accepted", data: updated });
    } catch (error) {
        console.error("Accept appointment error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function completeAppointment(req: Request, res: Response) {
    try {
        const appointmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const actorId = req.user?.id;
        const role = req.user?.role;

        if (!appointmentId) {
            return res.status(400).json({ message: "Invalid appointment ID" });
        }
        if (!actorId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const staffHandlerId = await resolveStaffHandlerId(actorId, role);
        if (!staffHandlerId) {
            return res.status(401).json({ message: "Could not resolve staff handler" });
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                property: { select: { title: true } },
                user: { select: { id: true } }
            }
        });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.status !== "WAITING") {
            return res.status(400).json({ message: "Only appointments in Waiting status can be marked as completed" });
        }

        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: "COMPLETED", staffHandlerId },
            include: {
                property: { select: { id: true, title: true } },
                user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                staffHandler: { select: { id: true, firstName: true, lastName: true, role: true } }
            }
        });

        try {
            await createAndSendUserNotification({
                userId: appointment.userId,
                type: NotificationType.APPOINTMENT_UPDATED,
                title: "Appointment completed",
                description: `Your appointment for ${appointment.property.title} has been completed.`,
                data: { appointmentId, propertyId: appointment.propertyId }
            });
        } catch (e) {
            console.error("Appointment complete notification error:", e);
        }

        return res.status(200).json({ success: true, message: "Appointment marked as completed", data: updated });
    } catch (error) {
        console.error("Complete appointment error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function rejectAppointment(req: Request, res: Response) {
    try {
        const appointmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const actorId = req.user?.id;
        const role = req.user?.role;

        if (!appointmentId) {
            return res.status(400).json({ message: "Invalid appointment ID" });
        }
        if (!actorId || !role) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const staffHandlerId = await resolveStaffHandlerId(actorId, role);
        if (!staffHandlerId) {
            return res.status(401).json({ message: "Could not resolve staff handler" });
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                property: { select: { title: true } }
            }
        });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.status === "CANCELLED") {
            return res.status(400).json({ message: "Appointment is already cancelled" });
        }

        const updated = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: "CANCELLED", staffHandlerId },
            include: {
                property: { select: { id: true, title: true } },
                user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                staffHandler: { select: { id: true, firstName: true, lastName: true, role: true } }
            }
        });

        try {
            await createAndSendUserNotification({
                userId: appointment.userId,
                type: NotificationType.APPOINTMENT_CANCELLED,
                title: "Appointment rejected",
                description: `Your appointment for ${appointment.property.title} has been cancelled by staff.`,
                data: { appointmentId, propertyId: appointment.propertyId }
            });
        } catch (e) {
            console.error("Appointment reject notification error:", e);
        }

        return res.status(200).json({ success: true, message: "Appointment rejected", data: updated });
    } catch (error) {
        console.error("Reject appointment error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
