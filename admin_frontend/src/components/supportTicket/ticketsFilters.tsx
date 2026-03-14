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

export type TicketStatusFilter = "ALL" | "OPEN" | "CLOSED"

type TicketsFiltersProps = {
    filter: TicketStatusFilter
    onFilterChange: (filter: TicketStatusFilter) => void
}

export function TicketsFilters({ filter, onFilterChange }: TicketsFiltersProps) {
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
                        <DropdownMenuItem
                            className="font-medium"
                            onClick={() => onFilterChange("ALL")}
                        >
                            {filter === "ALL" && <Check className="mr-2 size-4" />}
                            All
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="font-medium"
                            onClick={() => onFilterChange("OPEN")}
                        >
                            {filter === "OPEN" && <Check className="mr-2 size-4" />}
                            Active
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="font-medium"
                            onClick={() => onFilterChange("CLOSED")}
                        >
                            {filter === "CLOSED" && <Check className="mr-2 size-4" />}
                            Resolved
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}