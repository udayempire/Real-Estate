"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronDown, Settings2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

export type StatusFilter = "Completed" | "Pending" | "Rejected" | null
export type PurposeFilter = "ACQUISITION_REWARD" | "REFERRAL_BONUS_5_PERCENT" | "REDEMPTION" | "GEM_REDEEM" | "EXCLUSIVE_SALE_REWARD" | null

export const PURPOSE_OPTIONS: { value: PurposeFilter; label: string }[] = [
    { value: null, label: "All" },
    { value: "ACQUISITION_REWARD", label: "Acquisition" },
    { value: "REFERRAL_BONUS_5_PERCENT", label: "Referral" },
    { value: "GEM_REDEEM", label: "Redemption" },
    { value: "EXCLUSIVE_SALE_REWARD", label: "Sale reward" },
]

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: null, label: "All" },
    { value: "Completed", label: "Completed" },
    { value: "Pending", label: "Pending" },
    { value: "Rejected", label: "Rejected" },
]

export type AmountRange = { min: string; max: string }

export type FinancialsFilterState = {
    purpose: PurposeFilter
    status: StatusFilter
    amountMin: string
    amountMax: string
}

const defaultFilterState: FinancialsFilterState = {
    purpose: null,
    status: null,
    amountMin: "",
    amountMax: "",
}

type FilterProps = {
    filters: FinancialsFilterState
    onFiltersChange: (f: FinancialsFilterState) => void
}

export function Filter({ filters, onFiltersChange }: FilterProps) {
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState<FinancialsFilterState>(filters)

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen)
        if (nextOpen) setDraft(filters)
    }

    const hasActiveFilter =
        filters.purpose != null ||
        filters.status != null ||
        filters.amountMin !== "" ||
        filters.amountMax !== ""

    const handleApply = () => {
        onFiltersChange(draft)
        setOpen(false)
    }

    const handleClear = () => {
        setDraft(defaultFilterState)
        onFiltersChange(defaultFilterState)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "gap-2 shadow-none border-2 h-10",
                        hasActiveFilter ? "bg-blue-50 border-blue-300 hover:bg-blue-100" : "hover:bg-zinc-50"
                    )}
                >
                    <Settings2Icon className="size-4 text-blue-500" />
                    Filter
                    <ChevronDown className="size-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 max-h-[min(70vh,400px)] overflow-y-auto">
                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium">Purpose</Label>
                        <div className="mt-2 space-y-1 grid grid-cols-2">
                            {PURPOSE_OPTIONS.map(({ value, label }) => (
                                <label
                                    key={value ?? "all"}
                                    className="flex items-center gap-2 cursor-pointer text-sm"
                                >
                                    <input
                                        type="radio"
                                        name="purpose"
                                        checked={draft.purpose === value}
                                        onChange={() => setDraft((p) => ({ ...p, purpose: value }))}
                                        className="rounded border-gray-300"
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="mt-2 space-y-1 grid grid-cols-2">
                            {STATUS_OPTIONS.map(({ value, label }) => (
                                <label
                                    key={value ?? "all"}
                                    className="flex items-center gap-2 cursor-pointer text-sm"
                                >
                                    <input
                                        type="radio"
                                        name="status"
                                        checked={draft.status === value}
                                        onChange={() => setDraft((p) => ({ ...p, status: value }))}
                                        className="rounded border-gray-300"
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Amount range</Label>
                        <div className="mt-2 flex gap-2">
                            <Input
                                type="number"
                                placeholder="Min"
                                value={draft.amountMin}
                                onChange={(e) => setDraft((p) => ({ ...p, amountMin: e.target.value }))}
                                className="h-9"
                                min={0}
                            />
                            <Input
                                type="number"
                                placeholder="Max"
                                value={draft.amountMax}
                                onChange={(e) => setDraft((p) => ({ ...p, amountMax: e.target.value }))}
                                className="h-9"
                                min={0}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={handleClear} className="flex-1">
                            Clear
                        </Button>
                        <Button size="sm" onClick={handleApply} className="flex-1">
                            Apply
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}