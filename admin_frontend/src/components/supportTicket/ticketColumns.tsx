"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Check, Clock, Eye, EyeOff, X } from "lucide-react";
import { ArrowUpDown } from "lucide-react";
import Link from "next/link";

export type TicketTableInterface = {
    id: string;
    userId: string;
    requestedBy: string;
    accountHolder: string;
    phoneNo: string;
    description: string;
    date: string;
    requestForCall: boolean;
    status: string;
};

interface GetTicketColumnsOptions {
    onView: (ticket: TicketTableInterface) => void;
    onCloseTicket: (ticket: TicketTableInterface) => void;
}

export function getTicketColumns({
    onView, onCloseTicket
}: GetTicketColumnsOptions): ColumnDef<TicketTableInterface>[] {
    return [
        {
            accessorKey: "requestedBy",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Requested By
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-medium pl-4">{row.original.requestedBy}</div>
            ),
        },
        {
            accessorKey: "accountHolder",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Account Holder
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const { accountHolder, userId } = row.original;
                return (
                    <Link
                        href={`/user/${userId}`}
                        className="font-medium pl-4 text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        {accountHolder}
                    </Link>
                );
            },
        },
        {
            accessorKey: "phoneNo",
            header: () => (
                <Button variant="ghost">Phone No</Button>
            ),
            cell: ({ row }) => (
                <div className="font-medium text-blue-500 pl-4">
                    {row.original.phoneNo}
                </div>
            ),
        },
        {
            accessorKey: "description",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Description
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const desc = row.original.description;
                const truncated =
                    desc.length > 30 ? desc.slice(0, 30) + "..." : desc;
                return <div className="font-medium">{truncated}</div>;
            },
        },
        {
            accessorKey: "date",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-medium">{row.original.date}</div>
            ),
        },
        {
            accessorKey: "requestForCall",
            header: "Request for Call",
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original.requestForCall ? "Yes" : "No"}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const { status } = row.original;
                const statusConfig: Record<
                    string,
                    { className: string; icon: React.ReactNode }
                > = {
                    Active: {
                        className: "text-green-700",
                        icon: <Clock className="size-4" />,
                    },
                    Resolved: {
                        className: "text-blue-500",
                        icon: <Check className="size-4" />,
                    },
                    OPEN: {
                        className: "text-green-700",
                        icon: <Clock className="size-4" />,
                    },
                    CLOSED: {
                        className: "text-blue-500",
                        icon: <Check className="size-4" />,
                    },
                    Unseen: {
                        className: "text-orange-700",
                        icon: <EyeOff className="size-4" />,
                    },
                };
                const config =
                    statusConfig[status] || statusConfig.Unseen || {
                        className: "bg-gray-100 text-gray-700",
                        icon: null,
                    };
                return (
                    <div
                        className={`flex items-center gap-1 py-1 rounded-full font-medium w-fit ${config.className}`}
                    >
                        {config.icon}
                        {status}
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const ticket = row.original;
                const isResolved =
                    ticket.status === "Resolved" || ticket.status === "CLOSED";
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={() => onView(ticket)}
                            title="View details"
                        >
                            <Eye className="size-4" />
                        </Button>
                        {!isResolved && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 gap-1.5 hover:text-white bg-red-500 text-white hover:bg-red-600 rounded-full"
                                onClick={() => onCloseTicket(ticket)}
                                title="Close ticket"
                            >
                                <X className="size-4" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];
}
