"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { type AppointmentTableInterface } from "./appointmentColumns"
import { Button } from "../ui/button"
import { Check, X } from "lucide-react"

interface AppointmentDetailsDialogProps {
    appointment: AppointmentTableInterface | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onAccept?: (appointment: AppointmentTableInterface) => void
    onReject?: (appointment: AppointmentTableInterface) => void
    loading?: "accept" | "reject" | null
}

export function AppointmentDetailsDialog({
    appointment,
    open,
    onOpenChange,
    onAccept,
    onReject,
    loading,
}: AppointmentDetailsDialogProps) {
    if (!appointment) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Appointment Details</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">ID</span>
                        <span className="font-mono text-xs">{appointment.id}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">User Name</span>
                        <Link
                            href={`/user/${appointment.userId}`}
                            className="font-medium text-blue-600 hover:underline"
                            target="_blank"
                        >
                            {appointment.userName}
                        </Link>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Property</span>
                        <Link
                            href={`/property/${appointment.propertyId}`}
                            className="font-medium text-blue-600 hover:underline"
                            target="_blank"
                        >
                            {appointment.purpose}
                        </Link>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Staff Handler</span>
                        <span>{appointment.staffHandler}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Date</span>
                        <span>{appointment.dateStr}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Time</span>
                        <span>{appointment.timeStr}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Pre-Booked</span>
                        <span>{appointment.isPreBooked ? "Yes" : "No"}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Status</span>
                        <span>{appointment.status}</span>
                    </div>

                    {appointment.canAcceptReject && onAccept && onReject && (
                        <div className="flex gap-2 pt-4">
                            <Button
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                onClick={() => onAccept(appointment)}
                                disabled={!!loading}
                            >
                                {loading === "accept" ? (
                                    "Accepting…"
                                ) : (
                                    <>
                                        <Check className="size-4 mr-2" />
                                        Accept
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => onReject(appointment)}
                                disabled={!!loading}
                            >
                                {loading === "reject" ? (
                                    "Rejecting…"
                                ) : (
                                    <>
                                        <X className="size-4 mr-2" />
                                        Reject
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
