"use client"

import Image from "next/image"
import { Calendar, Clock, MoreVertical, Eye, Pencil, Trash2, X, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Banner, BannerStatus } from "./types"

const statusConfig: Record<BannerStatus, { dot: string; bg: string; text: string }> = {
    Active: { dot: "bg-green-500", bg: "bg-zinc-900/50", text: "text-white" },
    Inactive: { dot: "bg-red-500", bg: "bg-zinc-900/50", text: "text-white" },
    Completed: { dot: "bg-blue-500", bg: "bg-zinc-900/50", text: "text-white" },
    Pending: { dot: "bg-yellow-500", bg: "bg-zinc-900/50", text: "text-white" },
}

interface BannerCardProps {
    banner: Banner
    variant?: "pending" | "default"
    onApprove?: (id: string) => void
    onReject?: (id: string) => void
    onView?: (id: string) => void
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
}

export function BannerCard({
    banner,
    variant = "default",
    onApprove,
    onReject,
    onView,
    onEdit,
    onDelete,
}: BannerCardProps) {
    const status = statusConfig[banner.status]

    return (
        <div className="overflow-hidden rounded-xl border bg-white">
            {/* Image with overlays */}
            <div className="relative">
                <Image
                    src={banner.image}
                    alt="Banner"
                    width={400}
                    height={220}
                    className="w-full h-auto object-cover aspect-video"
                />

                {/* Status badge */}
                <div className={`absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.bg} ${status.text}`}>
                    <span className={`size-2 rounded-full ${status.dot}`} />
                    {banner.status}
                </div>

                {/* Three-dot menu */}
                <div className="absolute top-3 right-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 bg-white/80 hover:bg-white rounded-full"
                            >
                                <MoreVertical className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => onView?.(banner.id)} className="gap-2">
                                <Eye className="size-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit?.(banner.id)} className="gap-2">
                                <Pencil className="size-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete?.(banner.id)} className="gap-2 text-red-600 focus:text-red-600">
                                <Trash2 className="size-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Footer: Date, Time, and optional actions */}
            {variant === "pending" ? (
                <div className="flex border-t">
                    <button
                        onClick={() => onReject?.(banner.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium bg-red-100 text-red-500 hover:bg-red-200 cursor-pointer transition-colors"
                    >
                        <X className="size-4" />
                        Reject
                    </button>
                    <button
                        onClick={() => onApprove?.(banner.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 cursor-pointer transition-colors"
                    >
                        <CheckCheck className="size-4" />
                        Approve
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-4 px-3 py-2.5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5" />
                        {banner.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        {banner.time}
                    </span>
                </div>
            )}
        </div>
    )
}
