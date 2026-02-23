"use client"

import { BannerToolbar } from "./bannerToolbar"
import { BannerGrid } from "./bannerGrid"
import type { Banner } from "./types"

interface BannerSectionProps {
    title: string
    banners: Banner[]
    variant?: "pending" | "default"
    showAddButton?: boolean
    onApprove?: (id: string) => void
    onReject?: (id: string) => void
    onView?: (id: string) => void
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
    onAddNew?: () => void
}

export function BannerSection({
    title,
    banners,
    variant = "default",
    showAddButton = false,
    onApprove,
    onReject,
    onView,
    onEdit,
    onDelete,
    onAddNew,
}: BannerSectionProps) {
    return (
        <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold">{title}</h2>
                <BannerToolbar showAddButton={showAddButton} onAddNew={onAddNew} />
            </div>
            <BannerGrid
                banners={banners}
                variant={variant}
                onApprove={onApprove}
                onReject={onReject}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </section>
    )
}
