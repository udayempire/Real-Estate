"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { type TicketTableInterface } from "./ticketColumns"
import { Button } from "../ui/button"

interface TicketDetailsDialogProps {
    ticket: TicketTableInterface | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onRequestCloseTicket?: (ticket: TicketTableInterface) => void
}

export function TicketDetailsDialog({ ticket, open, onOpenChange, onRequestCloseTicket }: TicketDetailsDialogProps) {
    if (!ticket) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Ticket Details</DialogTitle>
                </DialogHeader>
                <div>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Ticket ID</span>
                        <span className="font-mono">{ticket.id}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Account Holder</span>
                        <Link
                            href={`/user/${ticket.userId}`}
                            className="font-medium text-blue-600 hover:underline"
                        >
                            {ticket.accountHolder}
                        </Link>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Submitted By</span>
                        <span>{ticket.requestedBy}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Status</span>
                        <span>{ticket.status}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Phone No</span>
                        <span>{ticket.phoneNo}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Request for Call</span>
                        <span>{ticket.requestForCall ? "Yes" : "No"}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Created Date</span>
                        <span>{ticket.date}</span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Description</span>
                        <p className="text-muted-foreground">{ticket.description}</p>
                    </div>
                </div>
                {onRequestCloseTicket &&
                    ticket.status !== "Resolved" &&
                    ticket.status !== "CLOSED" && (
                        <Button
                            className="w-full"
                            variant="destructive"
                            onClick={() => {
                                onOpenChange(false);
                                onRequestCloseTicket(ticket);
                            }}
                        >
                            Close Ticket
                        </Button>
                    )}
                </div>

            </DialogContent>
        </Dialog>
    )
}
