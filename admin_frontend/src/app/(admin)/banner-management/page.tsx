"use client"

import { BannerSection } from "@/components/banner_management/bannerSection"
import type { Banner } from "@/components/banner_management/types"

function makeBanners(count: number, statuses: Banner["status"][]): Banner[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `banner-${crypto.randomUUID()}`,
        image: "/bannerDemo.png",
        status: statuses[i % statuses.length],
        date: "12th Feb, 2025",
        time: "09:00 AM",
    }))
}

const pendingBanners = makeBanners(4, ["Active"])
const activeBanners = makeBanners(4, ["Active"])
const allBanners = makeBanners(8, ["Active", "Inactive", "Completed", "Active"])

export default function BannerManagementPage() {
    const handleApprove = (id: string) => {
        console.log("Approve banner:", id)
    }

    const handleReject = (id: string) => {
        console.log("Reject banner:", id)
    }

    const handleView = (id: string) => {
        console.log("View banner:", id)
    }

    const handleEdit = (id: string) => {
        console.log("Edit banner:", id)
    }

    const handleDelete = (id: string) => {
        console.log("Delete banner:", id)
    }

    const handleAddNew = () => {
        console.log("Add new banner")
    }

    return (
        <div className="space-y-10 p-6">
            <h1 className="text-2xl font-bold">Banner Management</h1>

            <BannerSection
                title="Pending Approval"
                banners={pendingBanners}
                variant="pending"
                showAddButton
                onApprove={handleApprove}
                onReject={handleReject}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddNew={handleAddNew}
            />

            <BannerSection
                title="Active"
                banners={activeBanners}
                showAddButton
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddNew={handleAddNew}
            />

            <BannerSection
                title="All"
                banners={allBanners}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    )
}
