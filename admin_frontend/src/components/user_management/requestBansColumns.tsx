"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Check, Clock, X, ArrowUpDown } from "lucide-react"
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

export type BanRequestRow = {
    id: string
    userId: string
    userName: string
    email: string
    gems: number
    kycStatus: string
    propertyListings: {
        total: number
        sold: number
        active: number
        unlisted: number
    }
    requestedByStaff: string
    status: "Pending" | "Approved" | "Rejected"
    createdAt: string
}

function getErrorMessage(err: unknown): string {
    if (err instanceof AxiosError) {
        const data = err.response?.data as { message?: string; error?: string } | undefined
        return data?.message ?? data?.error ?? err.message ?? "Request failed"
    }
    return "Something went wrong"
}

export function createBanRequestColumns(onRefetch: () => void): ColumnDef<BanRequestRow>[] {
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
                const r = row.original
                return (
                    <Link
                        target="_blank"
                        href={`/user/${r.userId}`}
                        className="font-medium pl-4 bg-zinc-200 rounded-full hover:bg-zinc-300 hover:text-black text-black p-2 text-center px-4"
                    >
                        {r.userName}
                    </Link>
                )
            },
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => (
                <div className="font-medium">{row.original.email}</div>
            ),
        },
        // {
        //     id: "propertyListings",
        //     header: () => (
        //         <h1 className="pl-10">Property Listing Details</h1>
        //     ),
        //     cell: ({ row }) => {
        //         const l = row.original.propertyListings
        //         return (
        //             <div className="text-sm text-foreground font-semibold whitespace-nowrap">
        //                 Total: <span className="font-medium text-foreground">{l.total}</span>
        //                 {" , Sold: "}<span className="font-medium text-foreground">{l.sold}</span>
        //                 {", Active: "}<span className="font-medium text-foreground">{l.active}</span>
        //                 {", Unlisted: "}<span className="font-medium text-foreground">{l.unlisted}</span>
        //             </div>
        //         )
        //     },
        // },
        // {
        //     accessorKey: "gems",
        //     header: ({ column }) => (
        //         <Button
        //             variant="ghost"
        //             onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        //         >
        //             Gems
        //             <ArrowUpDown className="ml-2 h-4 w-4" />
        //         </Button>
        //     ),
        //     cell: ({ row }) => (
        //         <div className="flex items-center gap-1.5 font-semibold text-green-600">
        //             <span className="text-orange-500"><Gem className="size-4 text-green-400" /></span>
        //             <p className="text-black font-medium">
        //                 {row.original.gems.toLocaleString()}
        //             </p>
        //         </div>
        //     ),
        // },
        // {
        //     accessorKey: "kycStatus",
        //     header: () => (
        //         <h1 className="pl-12">KYC Status</h1>
        //     ),
        //     cell: ({ row }) => {
        //         const kycStatus = row.original.kycStatus
        //         return (
        //             <div className="flex items-center gap-1.5 font-medium">
        //                 <p className="text-foreground font-bold">UID: </p>
        //                 <p className="text-foreground font-medium">{kycStatus}</p>
        //                 <p className="text-foreground font-bold">PAN: </p>
        //                 <p className="text-foreground font-medium">{kycStatus}</p>
        //             </div>
        //         )
        //     },
        // },
        {
            accessorKey: "requestedByStaff",
            header: "Requested By",
            cell: ({ row }) => (
                <div className="font-semibold text-blue-500">{row.original.requestedByStaff}</div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const { status } = row.original
                const config: Record<
                    string,
                    { className: string; icon: React.ReactNode }
                > = {
                    Approved: {
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
                const c = config[status]
                return (
                    <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${
                            c?.className || "bg-gray-100 text-gray-700"
                        }`}
                    >
                        {c?.icon}
                        {status}
                    </div>
                )
            },
        },
        {
            accessorKey: "createdAt",
            header: "Requested On",
            cell: ({ row }) => (
                <div className="font-medium">{row.original.createdAt}</div>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const r = row.original
                if (r.status !== "Pending") return <span className="text-gray-400 text-sm">—</span>
                return (
                    <BanRequestActionsCell
                        requestId={r.id}
                        userName={r.userName}
                        onSuccess={onRefetch}
                    />
                )
            },
        },
    ]
}

function BanRequestActionsCell({
    requestId,
    userName,
    onSuccess,
}: {
    requestId: string
    userName: string
    onSuccess: () => void
}) {
    const [loading, setLoading] = useState<"approve" | "reject" | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [approveOpen, setApproveOpen] = useState(false)
    const [rejectOpen, setRejectOpen] = useState(false)

    const runApprove = async () => {
        setLoading("approve")
        setError(null)
        setApproveOpen(false)
        try {
            await api.put(`/staff/users/ban-requests/${requestId}`, { decision: "APPROVED" })
            onSuccess()
        } catch (err) {
            setLoading(null)
            setError(getErrorMessage(err))
        }
    }

    const runReject = async () => {
        setLoading("reject")
        setError(null)
        setRejectOpen(false)
        try {
            await api.put(`/staff/users/ban-requests/${requestId}`, { decision: "REJECTED" })
            onSuccess()
        } catch (err) {
            setLoading(null)
            setError(getErrorMessage(err))
        }
    }

    return (
        <div className="flex flex-col gap-1">
            {error && (
                <p className="text-xs text-red-600" title={error}>
                    {error.length > 40 ? error.slice(0, 40) + "…" : error}
                </p>
            )}
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="default"
                    className="h-8 w-8 rounded-full bg-green-600 hover:bg-green-700 p-0"
                    onClick={() => setApproveOpen(true)}
                    disabled={loading != null}
                >
                    {loading === "approve" ? "..." : <Check className="size-4" />}
                </Button>
                <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 rounded-full p-0"
                    onClick={() => setRejectOpen(true)}
                    disabled={loading != null}
                >
                    {loading === "reject" ? "..." : <X className="size-4" />}
                </Button>
            </div>

            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                <DialogContent showCloseButton>
                    <DialogHeader>
                        <DialogTitle>Approve Ban Request</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve the ban request for <strong>{userName}</strong>? The user will be blocked.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter showCloseButton={false}>
                        <Button variant="outline" onClick={() => setApproveOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={runApprove}
                            disabled={loading === "approve"}
                        >
                            {loading === "approve" ? "Approving…" : "Approve"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent showCloseButton>
                    <DialogHeader>
                        <DialogTitle>Reject Ban Request</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject the ban request for <strong>{userName}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter showCloseButton={false}>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={runReject}
                            disabled={loading === "reject"}
                        >
                            {loading === "reject" ? "Rejecting…" : "Reject"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
