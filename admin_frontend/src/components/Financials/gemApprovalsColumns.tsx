"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AxiosError } from "axios"
import { api } from "@/lib/api"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Check, Clock, Eye, Gem, X } from "lucide-react"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export type GemApprovalRow = {
    id: string
    userId: string
    userName: string
    userEmail?: string
    purpose: string
    requestType: "EXCLUSIVE_ACQUISITION_REWARD" | "EXCLUSIVE_SALE_REWARD" | "REDEMPTION"
    status: "Pending" | "Approved" | "Rejected"
    amount: number
    baseGems?: number
    referralGems?: number
    referralEmail?: string
    requestedByStaff: string
    details: string
    propertyId: string | null
}

function getErrorMessage(err: unknown): string {
    if (err instanceof AxiosError) {
        const data = err.response?.data as { message?: string; error?: string } | undefined
        return data?.message ?? data?.error ?? err.message ?? "Request failed"
    }
    return "Something went wrong"
}

export function createGemApprovalsColumns(onRefetch: () => void): ColumnDef<GemApprovalRow>[] {
    return [
    {
        accessorKey: "userName",
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="text-lg"
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
        accessorKey: "purpose",
        header: () => (
            <Button variant="ghost" className="text-lg">Purpose</Button>
        ),
        cell: ({ row }) => (
            <div className="font-medium text-blue-500">{row.original.purpose}</div>
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
        accessorKey: "amount",
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="text-lg"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Amount
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center gap-1 font-medium pl-5 text-green-500">
                <Gem className="size-4 text-green-500" />
                {row.original.amount.toLocaleString()}
            </div>
        ),
    },
    {
        accessorKey: "requestedByStaff",
        header: "Requested By Staff",
        cell: ({ row }) => (
            <div className="font-semibold text-blue-500">{row.original.requestedByStaff}</div>
        ),
    },
    {
        accessorKey: "details",
        header: "Details",
        cell: ({ row }) => (
            <div className="font-medium">{row.original.details}</div>
        ),
    },
    {
        id: "propertyDetail",
        header: "Property View",
        cell: ({ row }) => {
            const r = row.original
            const hasProperty = Boolean(r.propertyId)
            return (
                <ViewPropertyButton
                    propertyId={r.propertyId ?? null}
                    hasProperty={hasProperty}
                />
            )
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const r = row.original
            if (r.status !== "Pending") return <span className="text-gray-400 text-sm">—</span>
            return (
                <ActionsCell
                    row={r}
                    onSuccess={onRefetch}
                />
            )
        },
    },
    ]
}

function ViewPropertyButton({ propertyId, hasProperty }: { propertyId: string | null; hasProperty: boolean }) {
    const router = useRouter()
    return (
        <div className={`flex items-center gap-1 justify-center ${!hasProperty ? "cursor-not-allowed" : ""}`}>
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
                title={hasProperty ? "View property" : "No property linked"}
            >
                <Eye className="size-4" />
            </Button>
        </div>
    )
}

function ActionsCell({ row, onSuccess }: { row: GemApprovalRow; onSuccess: () => void }) {
    const [loading, setLoading] = useState<"approve" | "reject" | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [approveOpen, setApproveOpen] = useState(false)
    const [rejectOpen, setRejectOpen] = useState(false)

    const { id: requestId, requestType, userName, userEmail, amount, baseGems, referralGems, referralEmail } = row
    const isRedemption = requestType === "REDEMPTION"

    const runApprove = async () => {
        setLoading("approve")
        setError(null)
        setApproveOpen(false)
        try {
            if (isRedemption) {
                await api.post("/staff/gems/approve-redeem-request", { requestId })
            } else {
                await api.post("/staff/gems/approve", { requestId, decision: "APPROVED" })
            }
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
            if (isRedemption) {
                await api.post("/staff/gems/reject-redeem-request", { requestId })
            } else {
                await api.post("/staff/gems/approve", { requestId, decision: "REJECTED" })
            }
            onSuccess()
        } catch (err) {
            setLoading(null)
            setError(getErrorMessage(err))
        }
    }

    const baseAmount = baseGems ?? amount
    const referralAmount = referralGems ?? Math.floor(baseAmount * 0.05)

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
                    className="h-6 w-6 bg-green-600 rounded-full hover:bg-green-700"
                    onClick={() => setApproveOpen(true)}
                    disabled={loading != null}
                    title="Approve"
                >
                    {loading === "approve" ? "..." : <Check className="size-4" />}
                </Button>
                <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 w-6 bg-red-600 rounded-full hover:bg-red-700"
                    onClick={() => setRejectOpen(true)}
                    disabled={loading != null}
                    title="Reject"
                >
                    {loading === "reject" ? "..." : <X className="size-4" />}
                </Button>
            </div>

            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                <DialogContent showCloseButton={true}>
                    <DialogHeader>
                        <DialogTitle>Confirm Approve</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground space-y-2">
                            {isRedemption ? (
                                <span>
                                    Are you sure you want to deduct <strong>{amount.toLocaleString()}</strong> gems from{" "}
                                    <strong>{userName}</strong>
                                    {userEmail && ` (${userEmail})`}?
                                </span>
                            ) : (
                                <span>
                                    Confirm sending gems:
                                    <br />
                                    • <strong>{baseAmount.toLocaleString()}</strong> gems to{" "}
                                    <strong>{userName}</strong>
                                    {userEmail && ` (${userEmail})`}
                                    {(referralAmount > 0 || referralEmail) && (
                                        <>
                                            <br />
                                            • <strong>{referralAmount.toLocaleString()}</strong> gems (5%) to referral
                                            {referralEmail && ` (${referralEmail})`}
                                        </>
                                    )}
                                </span>
                            )}
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
                <DialogContent showCloseButton={true}>
                    <DialogHeader>
                        <DialogTitle>Confirm Reject</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject this request for <strong>{userName}</strong>?
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
