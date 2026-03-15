"use client"

import { useState } from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Check, Clock, Eye, X } from "lucide-react"
import { ArrowUpDown } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { acceptAppointment, rejectAppointment } from "@/actions/appointments"

export type AppointmentTableInterface = {
    id: string
    userId: string
    propertyId: string
    userName: string
    purpose: string
    staffHandler: string
    dateStr: string
    dateIso: string
    timeStr: string
    isPreBooked: boolean
    status: string
    notes: string | null
    canAcceptReject: boolean
}

function ActionsCell({ row, onSuccess }: { row: AppointmentTableInterface; onSuccess: () => void }) {
    const [loading, setLoading] = useState<"accept" | "reject" | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [acceptOpen, setAcceptOpen] = useState(false)
    const [rejectOpen, setRejectOpen] = useState(false)

    const runAccept = async () => {
        setLoading("accept")
        setError(null)
        setAcceptOpen(false)
        setDetailsOpen(false)
        try {
            await acceptAppointment(row.id)
            onSuccess()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Request failed")
        } finally {
            setLoading(null)
        }
    }

    const runReject = async () => {
        setLoading("reject")
        setError(null)
        setRejectOpen(false)
        setDetailsOpen(false)
        try {
            await rejectAppointment(row.id)
            onSuccess()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Request failed")
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                    onClick={() => setDetailsOpen(true)}
                    title="View details"
                >
                    <Eye className="size-4" />
                </Button>
                {row.canAcceptReject && (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:text-white bg-green-500 text-white hover:bg-green-600 rounded-full"
                            onClick={() => setAcceptOpen(true)}
                            disabled={!!loading}
                            title="Accept"
                        >
                            <Check className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:text-white bg-red-500 text-white hover:bg-red-600 rounded-full"
                            onClick={() => setRejectOpen(true)}
                            disabled={!!loading}
                            title="Reject"
                        >
                            <X className="size-4" />
                        </Button>
                    </>
                )}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}

            {/* Details dialog with all info + Accept/Reject */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Appointment Details</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                            <span className="font-medium text-muted-foreground">Appointment ID</span>
                            <span className="font-mono text-xs">{row.id}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                            <span className="font-medium text-muted-foreground">User Name</span>
                            <Link
                                href={`/user/${row.userId}`}
                                className="text-blue-600 hover:underline"
                                target="_blank"
                            >
                                {row.userName}
                            </Link>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                            <span className="font-medium text-muted-foreground">Property</span>
                            <Link
                                href={`/property/${row.propertyId}`}
                                className="text-blue-600 hover:underline"
                                target="_blank"
                            >
                                {row.purpose}
                            </Link>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                            <span className="font-medium text-muted-foreground">Staff Handler</span>
                            <span>{row.staffHandler}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                            <span className="font-medium text-muted-foreground">Date</span>
                            <span>{row.dateStr}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                            <span className="font-medium text-muted-foreground">Time</span>
                            <span>{row.timeStr}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                            <span className="font-medium text-muted-foreground">Pre-Booked</span>
                            <span>{row.isPreBooked ? "Yes" : "No"}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                            <span className="font-medium text-muted-foreground">Status</span>
                            <span>{row.status}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                            <span className="font-medium text-muted-foreground">Notes</span>
                            <p className="text-muted-foreground whitespace-pre-wrap">{row.notes ?? "—"}</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                            Close
                        </Button>
                        {row.canAcceptReject && (
                            <>
                                <Button
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                    onClick={() => {
                                        setDetailsOpen(false)
                                        setAcceptOpen(true)
                                    }}
                                    disabled={!!loading}
                                >
                                    Accept
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setDetailsOpen(false)
                                        setRejectOpen(true)
                                    }}
                                    disabled={!!loading}
                                >
                                    Reject
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={acceptOpen} onOpenChange={setAcceptOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Accept appointment</DialogTitle>
                        <DialogDescription>Confirm this appointment for {row.purpose}?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAcceptOpen(false)}>Cancel</Button>
                        <Button onClick={runAccept} disabled={!!loading}>Accept</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject appointment</DialogTitle>
                        <DialogDescription>Reject and cancel this appointment for {row.purpose}?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={runReject} disabled={!!loading}>Reject</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export function createAppointmentColumns(onRefetch: () => void): ColumnDef<AppointmentTableInterface>[] {
    return [
        {
            accessorKey: "userName",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    User Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const r = row.original
                return (
                    <Link
                        href={`/user/${r.userId}`}
                        className="font-medium pl-4 text-blue-600 hover:underline"
                        target="_blank"
                    >
                        {r.userName}
                    </Link>
                )
            },
        },
        {
            accessorKey: "purpose",
            header: "Purpose",
            cell: ({ row }) => {
                const r = row.original
                return (
                    <Link
                        href={`/property/${r.propertyId}`}
                        target="_blank"
                        className="font-medium border border-zinc-300 bg-zinc-200 rounded-full px-3 py-0.5 inline-block hover:bg-zinc-300 hover:text-black text-black"
                    >
                        {r.purpose}
                    </Link>
                )
            },
        },
        {
            accessorKey: "staffHandler",
            header: "Staff Handler",
            cell: ({ row }) => (
                <div className="font-medium text-muted-foreground">{row.original.staffHandler}</div>
            ),
        },
        {
            accessorKey: "dateStr",
            header: "Date",
            cell: ({ row }) => <div className="font-medium">{row.original.dateStr}</div>,
        },
        {
            accessorKey: "timeStr",
            header: "Time",
            cell: ({ row }) => <div className="font-medium">{row.original.timeStr}</div>,
        },
        {
            accessorKey: "isPreBooked",
            header: "Pre-Booked",
            cell: ({ row }) => (
                <div className="font-medium">{row.original.isPreBooked ? "Yes" : "No"}</div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const { status } = row.original
                const statusConfig: Record<string, { className: string; icon: React.ReactNode }> = {
                    Completed: { className: "text-green-700", icon: <Check className="size-4" /> },
                    Cancelled: { className: "text-red-700", icon: <X className="size-4" /> },
                    Scheduled: { className: "text-blue-700", icon: <Clock className="size-4" /> },
                    Waiting: { className: "text-orange-700", icon: <Clock className="size-4" /> },
                }
                const config = statusConfig[status]
                return (
                    <div
                        className={`flex items-center gap-1 py-1 rounded-full text-xs font-medium w-fit ${
                            config?.className ?? "bg-gray-100 text-gray-700"
                        }`}
                    >
                        {config?.icon}
                        {status}
                    </div>
                )
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => <ActionsCell row={row.original} onSuccess={onRefetch} />,
        },
    ]
}
