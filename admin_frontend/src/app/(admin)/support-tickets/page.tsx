"use client";

import { useMemo, useState } from "react";
import { getTicketColumns, type TicketTableInterface } from "@/components/supportTicket/ticketColumns";
import { TicketDataTable } from "@/components/supportTicket/ticketDataTable";
import { TicketDetailsDialog } from "@/components/supportTicket/TicketDetailsDialog";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

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

async function getSupportTickets(): Promise<TicketTableInterface[]> {
    const response = await api.get("/staff/support-tickets");
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
    const [selectedTicket, setSelectedTicket] = useState<TicketTableInterface | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const { data = [], isLoading, isError, error } = useQuery({
        queryKey: ["support-tickets"],
        queryFn: getSupportTickets,
    });

    const columns = useMemo(
        () =>
            getTicketColumns({
                onView: (ticket) => {
                    setSelectedTicket(ticket);
                    setDialogOpen(true);
                },
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
            <TicketDataTable columns={columns} data={data} />
            <TicketDetailsDialog
                ticket={selectedTicket}
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setSelectedTicket(null);
                }}
            />
        </div>
    );
}
