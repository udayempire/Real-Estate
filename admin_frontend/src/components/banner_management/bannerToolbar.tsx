"use client"

import { Search, Upload, SlidersHorizontal, ArrowUpDown, Pencil, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BannerToolbarProps {
    onSearch?: (value: string) => void
    showAddButton?: boolean
    onAddNew?: () => void
}

export function BannerToolbar({
    onSearch,
    showAddButton = false,
    onAddNew,
}: BannerToolbarProps) {
    return (
        <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative w-full max-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                    placeholder="Search anything"
                    onChange={(e) => onSearch?.(e.target.value)}
                    className="h-10 pl-9 border-2 bg-white text-sm"
                />
            </div>

            {/* Export */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="hover:bg-zinc-50 gap-2 shadow-none border-2 h-10">
                        <Upload className="size-4 text-blue-500" />
                        Export
                        <ChevronDown className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuGroup>
                        <DropdownMenuItem className="font-medium">Export as XLSX</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="font-medium">Export as CSV</DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Filters */}
            <Button variant="outline" className="gap-2 shadow-none border-2 h-10">
                <SlidersHorizontal className="size-4" />
                Filters
                <ChevronDown className="size-4" />
            </Button>

            {/* Sort by */}
            <Button variant="outline" className="gap-2 shadow-none border-2 h-10">
                <ArrowUpDown className="size-4" />
                Sort by
                <ChevronDown className="size-4" />
            </Button>

            {/* Add New Banner */}
            {showAddButton && (
                <Button
                    onClick={onAddNew}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white h-10"
                >
                    <Pencil className="size-4" />
                    Add New Banner
                </Button>
            )}
        </div>
    )
}
