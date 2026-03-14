"use client";

import { useMemo, useState } from "react";
import { getTicketColumns, type TicketTableInterface } from "@/components/supportTicket/ticketColumns";
import { TicketDataTable } from "@/components/supportTicket/ticketDataTable";
import { TicketDetailsDialog } from "@/components/supportTicket/TicketDetailsDialog";
import { api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TicketStatusFilter } from "@/components/supportTicket/ticketsFilters";

type BackendTicket = {
    id: string;
    name: string;
    phoneNo: string;
    description: string;
    isRequestForCall: boolean;
    ticketStatus: string;
    userId: string;
    createdAt: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
    };
};

function mapStatus(ticketStatus: string): string {
    switch (ticketStatus) {
        case "OPEN":
            return "Active";
        case "CLOSED":
            return "Resolved";
        default:
            return ticketStatus;
    }
}

function formatDate(isoDate: string): string {
    try {
        const d = new Date(isoDate);
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return isoDate;
    }
}

function closeSupportTicket(ticket: TicketTableInterface): Promise<void> {
    return api.put(`/staff/support-tickets/${ticket.id}`).then((response) => {
        if (response.status === 200) {
            return response.data;
        }
        throw new Error("Failed to close support ticket");
    });
}

async function getSupportTickets(ticketStatusFilter?: TicketStatusFilter): Promise<TicketTableInterface[]> {
    const params =
        ticketStatusFilter && ticketStatusFilter !== "ALL"
            ? { ticketStatus: ticketStatusFilter }
            : {};
    const response = await api.get("/staff/support-tickets", { params });
    const tickets: BackendTicket[] = response.data?.data ?? [];

    return tickets.map((ticket) => {
        const accountHolder = `${ticket.user.firstName} ${ticket.user.lastName}`.trim() || ticket.user.email;
        return {
            id: ticket.id,
            userId: ticket.userId,
            requestedBy: ticket.name,
            accountHolder,
            phoneNo: ticket.phoneNo,
            description: ticket.description,
            date: formatDate(ticket.createdAt),
            requestForCall: ticket.isRequestForCall,
            status: mapStatus(ticket.ticketStatus),
        };
    });
}

export default function SupportTicketsPage() {
    const queryClient = useQueryClient();
    const [selectedTicket, setSelectedTicket] = useState<TicketTableInterface | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [ticketToClose, setTicketToClose] = useState<TicketTableInterface | null>(null);
    const [ticketStatusFilter, setTicketStatusFilter] = useState<TicketStatusFilter>("ALL");

    const { data = [], isLoading, isError, error } = useQuery({
        queryKey: ["support-tickets", ticketStatusFilter],
        queryFn: () => getSupportTickets(ticketStatusFilter),
    });

    const closeMutation = useMutation({
        mutationFn: (ticket: TicketTableInterface) => closeSupportTicket(ticket),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
            setTicketToClose(null);
        },
    });

    const columns = useMemo(
        () =>
            getTicketColumns({
                onView: (ticket) => {
                    setSelectedTicket(ticket);
                    setDialogOpen(true);
                },
                onCloseTicket: (ticket) => setTicketToClose(ticket),
            }),
        []
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <p className="text-muted-foreground">Loading tickets...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
                <p className="text-destructive font-medium">Failed to load tickets</p>
                <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : "An error occurred"}
                </p>
            </div>
        );
    }

    return (
        <div>
            <TicketDataTable
                columns={columns}
                data={data}
                ticketStatusFilter={ticketStatusFilter}
                onFilterChange={setTicketStatusFilter}
            />
            <TicketDetailsDialog
                ticket={selectedTicket}
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setSelectedTicket(null);
                }}
                onRequestCloseTicket={(ticket) => setTicketToClose(ticket)}
            />

            {/* Close ticket confirmation dialog */}
            <Dialog
                open={!!ticketToClose}
                onOpenChange={(open) => !open && setTicketToClose(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Close Ticket</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to close this ticket from{" "}
                            <span className="font-semibold">{ticketToClose?.requestedBy}</span>? It
                            will be marked as resolved.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => ticketToClose && closeMutation.mutate(ticketToClose)}
                            disabled={closeMutation.isPending}
                        >
                            {closeMutation.isPending ? "Closing..." : "Yes, Close"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
