"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Check, Settings2Icon } from "lucide-react"

export type AppointmentStatusFilter = "ALL" | "SCHEDULED" | "COMPLETED" | "CANCELLED" | "WAITING"

const STATUS_LABELS: Record<AppointmentStatusFilter, string> = {
    ALL: "All",
    SCHEDULED: "Scheduled",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    WAITING: "Waiting",
}

type FilterProps = {
    filter: AppointmentStatusFilter
    onFilterChange: (filter: AppointmentStatusFilter) => void
}

export function Filter({ filter, onFilterChange }: FilterProps) {
    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="hover:bg-zinc-50 gap-2 shadow-none border-2 h-10">
                        <Settings2Icon className="size-4 text-blue-500" />
                        Filter
                        <ChevronDown className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuGroup>
                        {(Object.entries(STATUS_LABELS) as [AppointmentStatusFilter, string][]).map(
                            ([value, label]) => (
                                <div key={value}>
                                    <DropdownMenuItem
                                        className="font-medium"
                                        onClick={() => onFilterChange(value)}
                                    >
                                        {filter === value && <Check className="mr-2 size-4" />}
                                        {label}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                </div>
                            )
                        )}
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
