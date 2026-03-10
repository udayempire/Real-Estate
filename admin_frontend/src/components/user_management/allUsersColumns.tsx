"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, Trash2, OctagonMinus, BadgeCheck, Gem, ArrowUpDown, Loader2 } from "lucide-react"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AxiosError } from "axios"
import { api } from "@/lib/api"
export enum KYCStatus {
    Verified = "Verified",
    Pending = "Pending",
}

export type UserColumnInterface = {
    id: string;
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

type AllUsersColumnsOptions = {
    onUserDeleted?: () => void
    onUserBlocked?: () => void
}

export function getAllUsersColumns(options?: AllUsersColumnsOptions): ColumnDef<UserColumnInterface>[] {
    const onUserDeleted = options?.onUserDeleted
    const onUserBlocked = options?.onUserBlocked

    return [
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
        header: ()=>{
            return (
                <h1 className="pl-10"
                >
                    Property Listing Details
                </h1>
            )
        },
        cell: ({ row }) => {
            const l = row.original.propertyListings
            return (
                <div className="text-sm text-foreground font-semibold whitespace-nowrap">
                    Total: <span className="font-medium text-foreground">{l.total}</span>
                    {" , Sold: "}<span className="font-medium text-foreground">{l.sold}</span>
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
        header: ()=>{
            return (
                <h1 className="pl-12"
                >
                    KYC Status
                </h1>
            )
        },
        cell: ({ row }) => {
            const kycStatus = row.original.kycStatus;

            return (
                <div className={`flex items-center gap-1.5 font-medium}`}>
                    <p className="text-foreground font-bold">UID: </p>

                    {/* {kycStatus == "Verified"
                        ? <ShieldCheck className="size-4 text-green-600" />
                        : <Clock className="size-4 text-orange-500" />
                    } */}
                    <p className="text-foreground font-medium">
                        {kycStatus}
                    </p>
                    <p className="text-foreground font-bold">PAN: </p>
                    {/* {kycStatus == "Verified"
                        ? <ShieldCheck className="size-4 text-green-600" />
                        : <Clock className="size-4 text-orange-500" />
                    } */}
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
                <ActionsCell
                    user={user}
                    onDeleted={onUserDeleted}
                    onBlocked={onUserBlocked}
                />
            )
        },
    },
]
}

function ActionsCell({
    user,
    onDeleted,
    onBlocked,
}: {
    user: UserColumnInterface
    onDeleted?: () => void
    onBlocked?: () => void
}) {
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [blockOpen, setBlockOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isBlocking, setIsBlocking] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [blockError, setBlockError] = useState<string | null>(null)

    const handleDelete = async () => {
        try {
            setIsDeleting(true)
            setDeleteError(null)
            await api.delete(`/staff/users/${user.id}`)
            setDeleteOpen(false)
            onDeleted?.()
        } catch (err) {
            console.error("Delete user error:", err)
            const msg = err instanceof AxiosError && err.response?.data?.message
                ? String(err.response.data.message)
                : "Failed to delete user"
            setDeleteError(msg)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleBlock = async () => {
        try {
            setIsBlocking(true)
            setBlockError(null)
            await api.put(`/staff/users/${user.id}/block`)
            setBlockOpen(false)
            onBlocked?.()
        } catch (err) {
            console.error("Block user error:", err)
            const msg = err instanceof AxiosError && err.response?.data?.message
                ? String(err.response.data.message)
                : "Failed to block user"
            setBlockError(msg)
        } finally {
            setIsBlocking(false)
        }
    }

    return (
        <>
            <div className="flex items-center gap-1">
                <Link
                    href={`/user/${user.id}`}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-blue-600 hover:bg-blue-100"
                >
                    <Eye className="size-4" />
                </Link>
                <Link
                    href={`/user/edit/${user.id}`}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-blue-600 hover:bg-blue-100"
                >
                    <Pencil className="size-4" />
                </Link>
                {!user.isBlocked && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-orange-600 hover:bg-orange-100"
                        onClick={() => setBlockOpen(true)}
                    >
                        <OctagonMinus className="size-4" />
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:bg-red-100"
                    onClick={() => setDeleteOpen(true)}
                >
                    <Trash2 className="size-4" />
                </Button>
            </div>

            <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Block User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to block {user.username}? They will no longer be able to access the platform.
                        </DialogDescription>
                    </DialogHeader>
                    {blockError && <p className="text-sm text-red-500">{blockError}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBlockOpen(false)} disabled={isBlocking}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleBlock}
                            disabled={isBlocking}
                        >
                            {isBlocking ? <Loader2 className="size-4 animate-spin" /> : null}
                            {isBlocking ? "Blocking..." : "Block"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {user.username}? This action cannot be undone and will remove all associated data.
                        </DialogDescription>
                    </DialogHeader>
                    {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : null}
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
