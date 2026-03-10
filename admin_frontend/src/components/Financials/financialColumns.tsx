"use client"

import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Check, Clock, Eye, Gem, X } from "lucide-react"
import { ArrowUpDown } from "lucide-react"

export type financeTableInterface = {
    userName: string;
    purpose: string;
    staffHandler: string;
    amount: string;
    details: string;
    status: string;
    propertyId?: string | null;
}

export const columns: ColumnDef<financeTableInterface>[] = [
    {
        accessorKey: "userName",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    className="text-lg"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    User Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const user = row.original
            return <div className="font-medium pl-4">{user.userName}</div>
        },
    },
    {
        accessorKey: "purpose",
        header: () => {
            return (
                <Button
                    variant="ghost"
                    className="text-lg"
                >
                    Purpose
                </Button>
            )
        },
        cell: ({ row }) => {
            const user = row.original
            return <div className="font-medium text-blue-500">{user.purpose}</div>

        }
    },
    {
        accessorKey: "staffHandler",
        header: "Staff Handler",
        cell: ({ row }) => {
            const user = row.original
            return <div className="font-semibold text-blue-500">{user.staffHandler}</div>
        },
    },
    {
        accessorKey: "amount",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    className="text-lg"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const user = row.original
            const isDeduct = String(user.amount).startsWith("-")
            
            return (
              <div className={`flex items-center gap-1 font-medium pl-5 ${isDeduct ? "text-red-500" : "text-green-500"}`}>
                <Gem className={`size-4 ${isDeduct ? "text-red-500" : "text-green-500"}`} />
                {user.amount}
              </div>
            )
        },
    },
    {
        accessorKey: "details",
        header: "Details",
        cell: ({ row }) => {
            const user = row.original
            return <div className="font-medium">{user.details}</div>
        },
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
              Completed: {
                className: "text-green-700",
                icon: <Check className="size-4" />,
              },
              Rejected: {
                className: "text-red-700",
                icon: <X className="size-4" />,
              },
              Pending: {
                className: "text-orange-700",
                icon: <Clock className="size-4" />,
              },
            }
          
            const config = statusConfig[status]
          
            return (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${
                  config?.className || "bg-gray-100 text-gray-700"
                }`}
              >
                {config?.icon}
                {status}
              </div>
            )
        },
    },
    {
        id: "propertyDetail",
        header: "Property Details",
        cell: ({ row }) => {
            const user = row.original
            const hasProperty = Boolean(user.propertyId)
            return (
                <ViewPropertyButton
                    propertyId={user.propertyId ?? null}
                    hasProperty={hasProperty}
                />
            )
        },
    },
]

function ViewPropertyButton({ propertyId, hasProperty }: { propertyId: string | null; hasProperty: boolean }) {
    const router = useRouter()

    return (
        <div
            className={`flex items-center gap-1 justify-center ${!hasProperty ? "cursor-not-allowed" : ""}`}
        >
            <Button
                variant="ghost"
                size="icon"
                className={
                    hasProperty
                        ? "h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                        : "h-8 w-8 text-gray-400 opacity-50 cursor-not-allowed pointer-events-none"
                }
                onClick={() => hasProperty && propertyId && router.push(`/property/${propertyId}`)}
                disabled={!hasProperty}
            >
                <Eye className="size-4" />
            </Button>
        </div>
    )
}
