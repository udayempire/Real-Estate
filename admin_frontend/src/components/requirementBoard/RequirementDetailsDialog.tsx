"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { type RequirementBoardTableInterface } from "./requirementColumns"
import { Button } from "../ui/button"
import { Search } from "lucide-react"

function requirementToSuggestParams(requirement: RequirementBoardTableInterface): URLSearchParams {
    const params = new URLSearchParams()
    if (requirement.preferredLocation?.trim()) {
        params.set("location", requirement.preferredLocation.trim())
    }
    if (requirement.budgetMin != null && requirement.budgetMin > 0) {
        params.set("priceMin", String(requirement.budgetMin))
    }
    if (requirement.budgetMax != null && requirement.budgetMax > 0) {
        params.set("priceMax", String(requirement.budgetMax))
    }
    if (requirement.propertyType?.trim()) {
        params.set("propertyType", requirement.propertyType.trim())
    }
    return params
}

interface RequirementDetailsDialogProps {
    requirement: RequirementBoardTableInterface | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onFulfill?: (req: RequirementBoardTableInterface) => void
    onClose?: (req: RequirementBoardTableInterface) => void
}

export function RequirementDetailsDialog({
    requirement,
    open,
    onOpenChange,
    onFulfill,
    onClose,
}: RequirementDetailsDialogProps) {
    if (!requirement) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Requirement Details</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Requirement ID</span>
                        <span className="font-mono">{requirement.id}</span>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">User</span>
                        <Link
                            href={`/user/${requirement.userId}`}
                            className="font-medium text-blue-600 hover:underline"
                        >
                            {requirement.userName}
                        </Link>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Email</span>
                        <span>{requirement.email}</span>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Preferred Location</span>
                        <span>{requirement.preferredLocation}</span>
                    </div>
                    {requirement.subLocation && (
                        <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                            <span className="font-medium text-muted-foreground">Sub Location</span>
                            <span>{requirement.subLocation}</span>
                        </div>
                    )}
                    {requirement.propertyType && (
                        <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                            <span className="font-medium text-muted-foreground">Property Type</span>
                            <span>{requirement.propertyType}</span>
                        </div>
                    )}
                    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Amount</span>
                        <span>{requirement.amount}</span>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Status</span>
                        <span>{requirement.status}</span>
                    </div>
                    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">Created</span>
                        <span>{requirement.createdAt}</span>
                    </div>
                    <Link
                        href={`/property/all-listings?${requirementToSuggestParams(requirement).toString()}`}
                        prefetch={false}
                        className="flex w-full mt-8"
                    >
                        <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                            <Search className="size-4" />
                            Suggest Properties
                        </Button>
                    </Link>
                </div>
                {(onFulfill || onClose) &&
                    (requirement.status === "Active" || requirement.status === "ACTIVE") && (
                        <div className="flex gap-2 pt-4">
                            {onFulfill && (
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => {
                                        onOpenChange(false)
                                        onFulfill(requirement)
                                    }}
                                >
                                    Fulfill
                                </Button>
                            )}
                            {onClose && (
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => {
                                        onOpenChange(false)
                                        onClose(requirement)
                                    }}
                                >
                                    Close
                                </Button>
                            )}
                        </div>
                    )}
            </DialogContent>
        </Dialog>
    )
}
