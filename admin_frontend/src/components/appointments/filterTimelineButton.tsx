"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type DateFilterParams = {
    date?: string
    startDate?: string
    endDate?: string
}

type FilterTimelineButtonProps = {
    onDateFilterChange?: (params: DateFilterParams | null) => void
    activeFilter?: DateFilterParams | null
}

export function FilterTimelineButton({
    onDateFilterChange,
    activeFilter,
}: FilterTimelineButtonProps) {
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState<"single" | "range">("single")
    const [singleDate, setSingleDate] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    const hasActiveFilter =
        activeFilter?.date ||
        (activeFilter?.startDate && activeFilter?.endDate)

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen)
        if (!nextOpen || !activeFilter) return

        if (activeFilter.date) {
            setMode("single")
            setSingleDate(activeFilter.date)
            setStartDate("")
            setEndDate("")
            return
        }

        if (activeFilter.startDate && activeFilter.endDate) {
            setMode("range")
            setStartDate(activeFilter.startDate)
            setEndDate(activeFilter.endDate)
            setSingleDate("")
        }
    }

    const handleApply = () => {
        if (mode === "single" && singleDate) {
            onDateFilterChange?.({ date: singleDate })
        } else if (mode === "range" && startDate && endDate) {
            onDateFilterChange?.({ startDate, endDate })
        }
        setOpen(false)
    }

    const handleClear = () => {
        setSingleDate("")
        setStartDate("")
        setEndDate("")
        onDateFilterChange?.(null)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "gap-2 shadow-none border-2 h-10",
                        hasActiveFilter
                            ? "bg-blue-50 border-blue-300 hover:bg-blue-100"
                            : "hover:bg-zinc-50"
                    )}
                >
                    <Calendar className="size-4 text-blue-500" />
                    Choose from Calendar
                    {hasActiveFilter && (
                        <span className="size-1.5 rounded-full bg-blue-500" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium">Filter by date</Label>
                    </div>

                    {mode === "single" ? (
                        <div className="space-y-2">
                            <Label htmlFor="single-date" className="text-sm">
                                Date
                            </Label>
                            <Input
                                id="single-date"
                                type="date"
                                value={singleDate}
                                onChange={(e) => setSingleDate(e.target.value)}
                                className="h-9"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-date" className="text-sm">
                                    Start Date
                                </Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-date" className="text-sm">
                                    End Date
                                </Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMode(mode === "single" ? "range" : "single")}
                            className="flex-1"
                        >
                            {mode === "single" ? "Date Range" : "Single Date"}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleClear}
                            className="flex-1"
                        >
                            Clear
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleApply}
                            disabled={
                                (mode === "single" && !singleDate) ||
                                (mode === "range" && (!startDate || !endDate))
                            }
                            className="flex-1"
                        >
                            Apply
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
