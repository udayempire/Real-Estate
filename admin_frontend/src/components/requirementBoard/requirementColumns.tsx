"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Check, CheckCircle, Clock, Eye, EyeOff, X } from "lucide-react"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"

export type RequirementBoardTableInterface = {
    id: string
    userId: string
    userName: string
    email: string
    preferredLocation: string
    amount: string
    status: string
    propertyType?: string
    subLocation?: string
    budgetMin?: number
    budgetMax?: number
    currency: string
    createdAt: string
}

interface GetRequirementColumnsOptions {
    onView: (req: RequirementBoardTableInterface) => void
    onFulfill: (req: RequirementBoardTableInterface) => void
    onClose: (req: RequirementBoardTableInterface) => void
}

export function getRequirementColumns({
    onView,
    onFulfill,
    onClose,
}: GetRequirementColumnsOptions): ColumnDef<RequirementBoardTableInterface>[] {
    return [
        {
            accessorKey: "userName",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    User Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const { userName, userId } = row.original
                return (
                    <Link
                        href={`/user/${userId}`}
                        className="font-medium pl-4 text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        {userName}
                    </Link>
                )
            },
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => (
                <div className="font-medium text-blue-500 pl-4">{row.original.email}</div>
            ),
        },
        {
            accessorKey: "preferredLocation",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Preferred Location
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-medium pl-4">{row.original.preferredLocation}</div>
            ),
        },
        {
            accessorKey: "amount",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="font-medium pl-5">{row.original.amount}</div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const { status } = row.original
                const statusConfig: Record<
                    string,
                    { className: string; icon: React.ReactNode }
                > = {
                    Active: { className: "text-green-700", icon: <Clock className="size-4" /> },
                    ACTIVE: { className: "text-green-700", icon: <Clock className="size-4" /> },
                    Fulfilled: {
                        className: "text-blue-500",
                        icon: <Check className="size-4" />,
                    },
                    FULFILLED: {
                        className: "text-blue-500",
                        icon: <CheckCircle className="size-4" />,
                    },
                    Closed: { className: "text-gray-600", icon: <X className="size-4" /> },
                    CLOSED: { className: "text-gray-600", icon: <X className="size-4" /> },
                    Unseen: { className: "text-orange-700", icon: <EyeOff className="size-4" /> },
                }
                const config =
                    statusConfig[status] || statusConfig.Unseen || {
                        className: "bg-gray-100 text-gray-700",
                        icon: null,
                    }
                return (
                    <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full font-medium w-fit ${config.className}`}
                    >
                        {config.icon}
                        {status}
                    </div>
                )
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const req = row.original
                const isActive = req.status === "Active" || req.status === "ACTIVE"
                return (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={() => onView(req)}
                            title="View details"
                        >
                            <Eye className="size-4" />
                            View
                        </Button>
                        {isActive && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1.5 text-green-600 hover:text-green-800 hover:bg-green-50"
                                    onClick={() => onFulfill(req)}
                                    title="Fulfill"
                                >
                                    <CheckCircle className="size-4" />
                                    Fulfill
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-1.5 text-red-600 hover:text-red-800 hover:bg-red-50"
                                    onClick={() => onClose(req)}
                                    title="Close"
                                >
                                    <X className="size-4" />
                                    Close
                                </Button>
                            </>
                        )}
                    </div>
                )
            },
        },
    ]
}
