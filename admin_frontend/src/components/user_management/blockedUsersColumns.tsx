"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Eye, Pencil, ArrowUpDown, Unlock, Loader2, Trash2, Gem, BadgeCheck } from "lucide-react"
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

export type BlockedUserColumnInterface = {
    id: string
    username: string
    email: string
    blockedOn: string
    blockedOnRaw?: string | null
    gems?: number
    isVerifiedSeller?: boolean
    isBlueTick?: boolean
}

type BlockedUsersColumnsOptions = {
    onUserUnblocked?: () => void
    onUserDeleted?: () => void
}

export function getBlockedUsersColumns(options?: BlockedUsersColumnsOptions): ColumnDef<BlockedUserColumnInterface>[] {
    const onUserUnblocked = options?.onUserUnblocked
    const onUserDeleted = options?.onUserDeleted

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
            const { username, isBlueTick, isVerifiedSeller } = row.original
            return (
                <div className="flex items-center gap-2 pl-2">
                    <span className={`size-2 rounded-full shrink-0 ${isVerifiedSeller ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="font-medium">{username}</span>
                    {isBlueTick && <BadgeCheck className="size-5 fill-blue-500 text-white " />}
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
                    {row.original.gems?.toLocaleString()}
                </p>
            </div>
        ),
    },
    {
        accessorKey: "blockedOn",
        header: "Blocked On",
        cell: ({ row }) => {
            const user = row.original
            return <div className="font-medium ">{user.blockedOn}</div>
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const user = row.original
            return (
                <UnblockUserCell user={user} onUnblocked={onUserUnblocked} onDeleted={onUserDeleted} />
            )
        },
    },
]
}

function UnblockUserCell({ user, onUnblocked, onDeleted }: { user: BlockedUserColumnInterface; onUnblocked?: () => void; onDeleted?: () => void }) {
    const [unblockOpen, setUnblockOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [isUnblocking, setIsUnblocking] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [unblockError, setUnblockError] = useState<string | null>(null)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    const handleUnblock = async () => {
        try {
            setIsUnblocking(true)
            setUnblockError(null)
            await api.put(`/staff/users/${user.id}/unblock`)
            setUnblockOpen(false)
            onUnblocked?.()
        } catch (err) {
            console.error("Unblock user error:", err)
            const msg = err instanceof AxiosError && err.response?.data?.message
                ? String(err.response.data.message)
                : "Failed to unblock user"
            setUnblockError(msg)
        } finally {
            setIsUnblocking(false)
        }
    }

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

    return (
        <>
            <div className="flex items-center gap-1">
                <Link
                    href={`/user/${user.id}`}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-blue-600 hover:bg-blue-100"
                    title="View"
                >
                    <Eye className="size-4" />
                </Link>
                <Link
                    href={`/user/edit/${user.id}`}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-blue-600 hover:bg-blue-100"
                    title="Edit"
                >
                    <Pencil className="size-4" />
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:bg-green-100"
                    onClick={() => setUnblockOpen(true)}
                    title="Unblock"
                >
                    <Unlock className="size-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:bg-red-100"
                    onClick={() => setDeleteOpen(true)}
                    title="Delete"
                >
                    <Trash2 className="size-4" />
                </Button>
            </div>

            <Dialog open={unblockOpen} onOpenChange={setUnblockOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unblock User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to unblock {user.username}? They will be able to access the platform again.
                        </DialogDescription>
                    </DialogHeader>
                    {unblockError && <p className="text-sm text-red-500">{unblockError}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUnblockOpen(false)} disabled={isUnblocking}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUnblock}
                            disabled={isUnblocking}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isUnblocking ? <Loader2 className="size-4 animate-spin" /> : null}
                            {isUnblocking ? "Unblocking..." : "Unblock"}
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
