"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2, OctagonMinus, BadgeCheck, ShieldCheck, Clock, Gem,ArrowUpDown } from "lucide-react"

export enum KYCStatus {
    Verified = "Verified",
    Pending = "Pending",
}

export type UserColumnInterface = {
    username: string
    email: string
    gems: number
    kycStatus: string
    isVerified: boolean
    propertyListings: {
        total: number
        sold: number
        active: number
        unlisted: number
    }
    isBlocked: boolean
}

export const allUsersColumns: ColumnDef<UserColumnInterface>[] = [
    {
        accessorKey: "username",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    User Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const { username, isBlocked, isVerified } = row.original
            return (
                <div className="flex items-center gap-2 pl-2">
                    <span className={`size-2 rounded-full shrink-0 ${isBlocked ? "bg-red-500" : "bg-green-500"}`} />
                    <span className="font-medium">{username}</span>
                    {isVerified && <BadgeCheck className="size-5 fill-blue-500 text-white " />}
                </div>
            )
        },
    },

    {
        accessorKey: "email",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Email
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },

    {
        id: "propertyListings",
        header: "Property Listing Details",
        cell: ({ row }) => {
            const l = row.original.propertyListings
            return (
                <div className="text-sm text-foreground font-semibold whitespace-nowrap">
                    Total: <span className="font-medium text-foreground">{l.total}</span>
                    {" ,Sold: "}<span className="font-medium text-foreground">{l.sold}</span>
                    {", Active: "}<span className="font-medium text-foreground">{l.active}</span>
                    {", Unlisted: "}<span className="font-medium text-foreground">{l.unlisted}</span>
                </div>
            )
        },
    },

    {
        accessorKey: "gems",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Gems
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => (
            <div className="flex items-center gap-1.5 font-semibold text-green-600">
                <span className="text-orange-500"><Gem className="size-4 text-green-400" /></span>
                <p className="text-black font-medium">
                    {row.original.gems.toLocaleString()}
                </p>
            </div>
        ),
    },

    {
        accessorKey: "kycStatus",
        header: "KYC Status",
        cell: ({ row }) => {
            const kycStatus = row.original.kycStatus;

            return (
                <div className={`flex items-center gap-1.5 font-medium}`}>
                    {kycStatus == "Verified"
                        ? <ShieldCheck className="size-4 text-green-600" />
                        : <Clock className="size-4 text-orange-500" />
                    }
                    <p className="text-foreground font-medium">
                        {kycStatus}
                    </p>
                </div>
            )
        },
    },

    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const user = row.original

            return (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                        onClick={() => console.log("View", user)}
                    >
                        <Eye className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 hover:bg-amber-100"
                        onClick={() => console.log("Edit", user)}
                    >
                        <Pencil className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-orange-600 hover:bg-orange-100"
                        onClick={() => console.log("Block", user)}
                    >
                        <OctagonMinus className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:bg-red-100"
                        onClick={() => console.log("Delete", user)}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            )
        },
    },
]
