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
import { SlidersHorizontal, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type VerifiedSellerFilter = "all" | "yes" | "no"
export type BlueTickFilter = "all" | "yes" | "no"

export type UsersFilterState = {
    verifiedSeller: VerifiedSellerFilter
    blueTick: BlueTickFilter
    gemsMin: string
    gemsMax: string
    blockedOnMin: string
    blockedOnMax: string
}

export const defaultUsersFilterState: UsersFilterState = {
    verifiedSeller: "all",
    blueTick: "all",
    gemsMin: "",
    gemsMax: "",
    blockedOnMin: "",
    blockedOnMax: "",
}

type UsersFilterProps = {
    filters: UsersFilterState
    onFiltersChange: (f: UsersFilterState) => void
    showBlockedOnDateRange?: boolean
}

const VERIFIED_OPTIONS: { value: VerifiedSellerFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "yes", label: "Verified Seller" },
    { value: "no", label: "Not Verified Seller" },
]

const BLUETICK_OPTIONS: { value: BlueTickFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "yes", label: "Blue Tick" },
    { value: "no", label: "No Blue Tick" },
]

export function UsersFilter({ filters, onFiltersChange, showBlockedOnDateRange }: UsersFilterProps) {
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState<UsersFilterState>(filters)

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen)
        if (nextOpen) setDraft(filters)
    }

    const hasActiveFilter =
        filters.verifiedSeller !== "all" ||
        filters.blueTick !== "all" ||
        filters.gemsMin !== "" ||
        filters.gemsMax !== "" ||
        filters.blockedOnMin !== "" ||
        filters.blockedOnMax !== ""

    const handleApply = () => {
        onFiltersChange(draft)
        setOpen(false)
    }

    const handleClear = () => {
        setDraft(defaultUsersFilterState)
        onFiltersChange(defaultUsersFilterState)
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
                    <SlidersHorizontal className="size-4 text-blue-500" />
                    Filters
                    <ChevronDown className="size-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 max-h-[min(70vh,400px)] overflow-y-auto">
                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium">Verified Seller</Label>
                        <div className="mt-2 space-y-1 grid grid-cols-2 font-medium">
                            {VERIFIED_OPTIONS.map(({ value, label }) => (
                                <label
                                    key={value}
                                    className="flex items-center gap-2 cursor-pointer text-sm"
                                >
                                    <input
                                        type="radio"
                                        name="verifiedSeller"
                                        checked={draft.verifiedSeller === value}
                                        onChange={() => setDraft((p) => ({ ...p, verifiedSeller: value }))}
                                        className="rounded border-gray-300"
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Blue Tick</Label>
                        <div className="mt-2 space-y-1 grid grid-cols-2 ">
                            {BLUETICK_OPTIONS.map(({ value, label }) => (
                                <label
                                    key={value}
                                    className="flex items-center gap-2 cursor-pointer text-sm font-medium"
                                >
                                    <input
                                        type="radio"
                                        name="blueTick"
                                        checked={draft.blueTick === value}
                                        onChange={() => setDraft((p) => ({ ...p, blueTick: value }))}
                                        className="rounded border-gray-300"
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Gems range</Label>
                        <div className="mt-2 flex gap-2">
                            <Input
                                type="number"
                                placeholder="Min"
                                value={draft.gemsMin}
                                onChange={(e) => setDraft((p) => ({ ...p, gemsMin: e.target.value }))}
                                className="h-9"
                                min={0}
                            />
                            <Input
                                type="number"
                                placeholder="Max"
                                value={draft.gemsMax}
                                onChange={(e) => setDraft((p) => ({ ...p, gemsMax: e.target.value }))}
                                className="h-9"
                                min={0}
                            />
                        </div>
                    </div>

                    {showBlockedOnDateRange && (
                        <div>
                            <Label className="text-sm font-medium">Blocked on date range</Label>
                            <div className="mt-2 flex gap-2">
                                <Input
                                    type="date"
                                    placeholder="From"
                                    value={draft.blockedOnMin}
                                    onChange={(e) => setDraft((p) => ({ ...p, blockedOnMin: e.target.value }))}
                                    className="h-9"
                                />
                                <Input
                                    type="date"
                                    placeholder="To"
                                    value={draft.blockedOnMax}
                                    onChange={(e) => setDraft((p) => ({ ...p, blockedOnMax: e.target.value }))}
                                    className="h-9"
                                />
                            </div>
                        </div>
                    )}

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

export function applyUsersFilter<T extends { isVerifiedSeller?: boolean; isBlueTick?: boolean; blueTick?: boolean; gems?: number; blockedOnRaw?: string | null }>(
    data: T[],
    filters: UsersFilterState
): T[] {
    return data.filter((row) => {
        const isVerified = row.isVerifiedSeller === true
        const hasBlueTick = (row.isBlueTick ?? row.blueTick) === true
        const gems = row.gems ?? 0

        if (filters.verifiedSeller === "yes" && !isVerified) return false
        if (filters.verifiedSeller === "no" && isVerified) return false
        if (filters.blueTick === "yes" && !hasBlueTick) return false
        if (filters.blueTick === "no" && hasBlueTick) return false

        const min = filters.gemsMin ? parseInt(filters.gemsMin, 10) : null
        const max = filters.gemsMax ? parseInt(filters.gemsMax, 10) : null
        if (min != null && !Number.isNaN(min) && gems < min) return false
        if (max != null && !Number.isNaN(max) && gems > max) return false

        if (row.blockedOnRaw && (filters.blockedOnMin || filters.blockedOnMax)) {
            const rowTime = new Date(row.blockedOnRaw).getTime()
            if (filters.blockedOnMin) {
                const minDate = new Date(filters.blockedOnMin)
                minDate.setHours(0, 0, 0, 0)
                if (rowTime < minDate.getTime()) return false
            }
            if (filters.blockedOnMax) {
                const maxDate = new Date(filters.blockedOnMax)
                maxDate.setHours(23, 59, 59, 999)
                if (rowTime > maxDate.getTime()) return false
            }
        }

        return true
    })
}
