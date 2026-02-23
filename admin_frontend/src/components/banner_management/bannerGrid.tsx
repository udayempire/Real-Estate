"use client"

import { BannerCard } from "./bannerCard"
import type { Banner } from "./types"

interface BannerGridProps {
    banners: Banner[]
    variant?: "pending" | "default"
    onApprove?: (id: string) => void
    onReject?: (id: string) => void
    onView?: (id: string) => void
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
}

export function BannerGrid({
    banners,
    variant = "default",
    onApprove,
    onReject,
    onView,
    onEdit,
    onDelete,
}: BannerGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {banners.map((banner) => (
                <BannerCard
                    key={banner.id}
                    banner={banner}
                    variant={variant}
                    onApprove={onApprove}
                    onReject={onReject}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    )
}
