"use client"

import { useMemo, useState } from "react"
import {
    getRequirementColumns,
    type RequirementBoardTableInterface,
} from "@/components/requirementBoard/requirementColumns"
import { RequirementDataTable } from "@/components/requirementBoard/requirementDataTable"
import { RequirementDetailsDialog } from "@/components/requirementBoard/RequirementDetailsDialog"
import { api } from "@/lib/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { RequirementStatusFilter } from "@/components/requirementBoard/requirementsFilters"

type BackendRequirement = {
    id: string
    preferredLocation: string
    subLocation: string | null
    propertyType: string | null
    budgetMin: number | null
    budgetMax: number | null
    currency: string
    status: string
    userId: string
    createdAt: string
    user: {
        id: string
        email: string
        firstName: string
        lastName: string
        phone: string | null
    }
}

function mapStatus(status: string): string {
    switch (status) {
        case "ACTIVE":
            return "Active"
        case "FULFILLED":
            return "Fulfilled"
        case "CLOSED":
            return "Closed"
        default:
            return status
    }
}

function formatAmount(budgetMin: number | null, budgetMax: number | null, currency: string): string {
    const sym = currency === "INR" ? "₹" : currency
    if (budgetMin != null && budgetMax != null) {
        return `${sym}${budgetMin.toLocaleString("en-IN")} - ${sym}${budgetMax.toLocaleString("en-IN")}`
    }
    if (budgetMin != null) return `${sym}${budgetMin.toLocaleString("en-IN")}`
    if (budgetMax != null) return `${sym}${budgetMax.toLocaleString("en-IN")}`
    return "-"
}

function formatDate(isoDate: string): string {
    try {
        const d = new Date(isoDate)
        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
    } catch {
        return isoDate
    }
}

async function getRequirements(
    statusFilter?: RequirementStatusFilter
): Promise<RequirementBoardTableInterface[]> {
    const params =
        statusFilter && statusFilter !== "ALL"
            ? { status: statusFilter }
            : {}
    const response = await api.get("/staff/requirements", { params })
    const items: BackendRequirement[] = response.data?.data ?? []

    return items.map((r) => {
        const userName = `${r.user.firstName} ${r.user.lastName}`.trim() || r.user.email
        return {
            id: r.id,
            userId: r.userId,
            userName,
            email: r.user.email,
            preferredLocation: r.preferredLocation,
            amount: formatAmount(r.budgetMin, r.budgetMax, r.currency),
            status: mapStatus(r.status),
            propertyType: r.propertyType ?? undefined,
            subLocation: r.subLocation ?? undefined,
            budgetMin: r.budgetMin ?? undefined,
            budgetMax: r.budgetMax ?? undefined,
            currency: r.currency,
            createdAt: formatDate(r.createdAt),
        }
    })
}

async function updateRequirementStatus(
    id: string,
    status: "FULFILLED" | "CLOSED"
): Promise<void> {
    await api.put(`/staff/requirements/${id}`, { status })
}

export default function RequirementBoardPage() {
    const queryClient = useQueryClient()
    const [selectedRequirement, setSelectedRequirement] =
        useState<RequirementBoardTableInterface | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [targetFulfill, setTargetFulfill] =
        useState<RequirementBoardTableInterface | null>(null)
    const [targetClose, setTargetClose] =
        useState<RequirementBoardTableInterface | null>(null)
    const [statusFilter, setStatusFilter] = useState<RequirementStatusFilter>("ALL")

    const { data = [], isLoading, isError, error } = useQuery({
        queryKey: ["requirements", statusFilter],
        queryFn: () => getRequirements(statusFilter),
    })

    const fulfillMutation = useMutation({
        mutationFn: (req: RequirementBoardTableInterface) =>
            updateRequirementStatus(req.id, "FULFILLED"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["requirements"] })
            setTargetFulfill(null)
            setDialogOpen(false)
            setSelectedRequirement(null)
        },
    })

    const closeMutation = useMutation({
        mutationFn: (req: RequirementBoardTableInterface) =>
            updateRequirementStatus(req.id, "CLOSED"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["requirements"] })
            setTargetClose(null)
            setDialogOpen(false)
            setSelectedRequirement(null)
        },
    })

    const columns = useMemo(
        () =>
            getRequirementColumns({
                onView: (req) => {
                    setSelectedRequirement(req)
                    setDialogOpen(true)
                },
                onFulfill: (req) => setTargetFulfill(req),
                onClose: (req) => setTargetClose(req),
            }),
        []
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <p className="text-muted-foreground">Loading requirements...</p>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
                <p className="text-destructive font-medium">Failed to load requirements</p>
                <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : "An error occurred"}
                </p>
            </div>
        )
    }

    return (
        <div className="mt-4">
            <RequirementDataTable
                columns={columns}
                data={data}
                statusFilter={statusFilter}
                onFilterChange={setStatusFilter}
            />
            <RequirementDetailsDialog
                requirement={selectedRequirement}
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) setSelectedRequirement(null)
                }}
                onFulfill={(req) => setTargetFulfill(req)}
                onClose={(req) => setTargetClose(req)}
            />

            {/* Fulfill confirmation */}
            <Dialog
                open={!!targetFulfill}
                onOpenChange={(open) => !open && setTargetFulfill(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Fulfill Requirement</DialogTitle>
                        <DialogDescription>
                            Mark this requirement from{" "}
                            <span className="font-semibold">{targetFulfill?.userName}</span> as
                            fulfilled?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() =>
                                targetFulfill && fulfillMutation.mutate(targetFulfill)
                            }
                            disabled={fulfillMutation.isPending}
                        >
                            {fulfillMutation.isPending ? "Fulfilling..." : "Yes, Fulfill"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Close confirmation */}
            <Dialog open={!!targetClose} onOpenChange={(open) => !open && setTargetClose(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Close Requirement</DialogTitle>
                        <DialogDescription>
                            Close this requirement from{" "}
                            <span className="font-semibold">{targetClose?.userName}</span>? It
                            will be marked as closed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => targetClose && closeMutation.mutate(targetClose)}
                            disabled={closeMutation.isPending}
                        >
                            {closeMutation.isPending ? "Closing..." : "Yes, Close"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
