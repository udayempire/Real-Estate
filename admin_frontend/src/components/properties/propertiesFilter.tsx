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
import { Bookmark, ChevronDown, Settings2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

/** Schema: RESIDENTIAL, COMMERCIAL, AGRICULTURAL */
export type CategoryFilter = "" | "RESIDENTIAL" | "COMMERCIAL" | "AGRICULTURAL"

/** Free-form property type */
export type PropertyTypeFilter = string

/** Schema: FullyFurnished, SemiFurnished, Unfurnished, FencedWired, FertileLand, OpenLand, Cultivated */
export type FurnishingFilter =
    | ""
    | "FullyFurnished"
    | "SemiFurnished"
    | "Unfurnished"
    | "FencedWired"
    | "FertileLand"
    | "OpenLand"
    | "Cultivated"

export interface PropertiesFilterState {
    category: CategoryFilter
    propertyType: PropertyTypeFilter
    furnishingStatus: FurnishingFilter
    priceMin: string
    priceMax: string
    location: string
    showOnlyBookmarked: boolean
}

export const defaultPropertiesFilterState: PropertiesFilterState = {
    category: "",
    propertyType: "",
    furnishingStatus: "",
    priceMin: "",
    priceMax: "",
    location: "",
    showOnlyBookmarked: false,
}

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
    { value: "", label: "All" },
    { value: "RESIDENTIAL", label: "Residential" },
    { value: "COMMERCIAL", label: "Commercial" },
    { value: "AGRICULTURAL", label: "Agriculture" },
]

const FURNISHING_OPTIONS: { value: FurnishingFilter; label: string }[] = [
    { value: "", label: "All" },
    { value: "FullyFurnished", label: "Fully furnished" },
    { value: "SemiFurnished", label: "Semi-furnished" },
    { value: "Unfurnished", label: "Unfurnished" },
    { value: "FencedWired", label: "Fenced/wired" },
    { value: "FertileLand", label: "Fertile land" },
    { value: "OpenLand", label: "Open land" },
    { value: "Cultivated", label: "Cultivated" },
]

interface PropertiesFilterProps {
    filters: PropertiesFilterState
    onFiltersChange: (f: PropertiesFilterState) => void
    showBookmarkOption?: boolean
}

export function PropertiesFilter({
    filters,
    onFiltersChange,
    showBookmarkOption = false,
}: PropertiesFilterProps) {
    const [open, setOpen] = useState(false)
    const [draft, setDraft] = useState<PropertiesFilterState>(filters)

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen)
        if (nextOpen) setDraft(filters)
    }

    const hasActiveFilter =
        filters.category !== "" ||
        filters.propertyType !== "" ||
        filters.furnishingStatus !== "" ||
        filters.priceMin !== "" ||
        filters.priceMax !== "" ||
        filters.location !== "" ||
        (showBookmarkOption && filters.showOnlyBookmarked)

    const handleApply = () => {
        onFiltersChange(draft)
        setOpen(false)
    }

    const handleClear = () => {
        const cleared = { ...defaultPropertiesFilterState }
        setDraft(cleared)
        onFiltersChange(cleared)
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
            <PopoverContent align="end" className="w-72 max-h-[min(70vh,420px)] overflow-y-auto">
                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium">Property category</Label>
                        <select
                            value={draft.category}
                            onChange={(e) =>
                                setDraft((p) => ({ ...p, category: e.target.value as CategoryFilter }))
                            }
                            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            {CATEGORY_OPTIONS.map(({ value, label }) => (
                                <option key={value || "all"} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Property type</Label>
                        <Input
                            placeholder="Any property type"
                            value={draft.propertyType}
                            onChange={(e) =>
                                setDraft((p) => ({ ...p, propertyType: e.target.value }))
                            }
                            className="mt-1.5 h-9"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Furnishing status</Label>
                        <select
                            value={draft.furnishingStatus}
                            onChange={(e) =>
                                setDraft((p) => ({
                                    ...p,
                                    furnishingStatus: e.target.value as FurnishingFilter,
                                }))
                            }
                            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            {FURNISHING_OPTIONS.map(({ value, label }) => (
                                <option key={value || "all"} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Location</Label>
                        <Input
                            placeholder="City or locality"
                            value={draft.location}
                            onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))}
                            className="mt-1.5 h-9"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium">Price range</Label>
                        <div className="mt-2 flex gap-2">
                            <Input
                                type="number"
                                placeholder="Min"
                                value={draft.priceMin}
                                onChange={(e) => setDraft((p) => ({ ...p, priceMin: e.target.value }))}
                                className="h-9"
                                min={0}
                                step={0.01}
                            />
                            <Input
                                type="number"
                                placeholder="Max"
                                value={draft.priceMax}
                                onChange={(e) => setDraft((p) => ({ ...p, priceMax: e.target.value }))}
                                className="h-9"
                                min={0}
                                step={0.01}
                            />
                        </div>
                    </div>

                    {showBookmarkOption && (
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={draft.showOnlyBookmarked}
                                onChange={(e) =>
                                    setDraft((p) => ({ ...p, showOnlyBookmarked: e.target.checked }))
                                }
                                className="rounded border-gray-300"
                            />
                            <Bookmark className="size-3.5 text-gray-600" />
                            Bookmarked only
                        </label>
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

/** Build query params for property APIs */
export function propertiesFilterToParams(state: PropertiesFilterState): Record<string, string> {
    const params: Record<string, string> = {}
    if (state.category) params.category = state.category
    if (state.propertyType) params.propertyType = state.propertyType
    if (state.furnishingStatus) params.furnishingStatus = state.furnishingStatus
    if (state.priceMin) params.priceMin = state.priceMin
    if (state.priceMax) params.priceMax = state.priceMax
    if (state.location) params.location = state.location
    return params
}

/** Parse URL search params into PropertiesFilterState */
export function paramsToPropertiesFilterState(
    searchParams: URLSearchParams,
    overrides?: Partial<PropertiesFilterState>
): PropertiesFilterState {
    const state = { ...defaultPropertiesFilterState }
    const category = searchParams.get("category")?.trim()
    const propertyType = searchParams.get("propertyType")?.trim()
    const furnishingStatus = searchParams.get("furnishingStatus")?.trim()
    const priceMin = searchParams.get("priceMin")?.trim() ?? ""
    const priceMax = searchParams.get("priceMax")?.trim() ?? ""
    const location = searchParams.get("location")?.trim() ?? ""
    if (category && ["RESIDENTIAL", "COMMERCIAL", "AGRICULTURAL"].includes(category)) {
        state.category = category as CategoryFilter
    }
    if (propertyType) state.propertyType = propertyType
    if (
        furnishingStatus &&
        ["FullyFurnished", "SemiFurnished", "Unfurnished", "FencedWired", "FertileLand", "OpenLand", "Cultivated"].includes(furnishingStatus)
    ) {
        state.furnishingStatus = furnishingStatus as FurnishingFilter
    }
    if (priceMin) state.priceMin = priceMin
    if (priceMax) state.priceMax = priceMax
    if (location) state.location = location
    if (overrides) Object.assign(state, overrides)
    return state
}
