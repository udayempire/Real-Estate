"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { PropertyGrid } from "@/components/properties/propertyGrid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExportButton } from "@/components/role_management/exportButton"
import { useAuth } from "@/contexts/AuthContext"
import type { PropertyCardData } from "@/components/properties/propertyCard"
import type { ExportColumn } from "@/components/role_management/exportButton"
import { api } from "@/lib/api"
import { fetchBookmarkedPropertyIds, toggleBookmark } from "@/lib/bookmarks"
import {
    PropertiesFilter,
    defaultPropertiesFilterState,
    propertiesFilterToParams,
    type PropertiesFilterState,
} from "@/components/properties/propertiesFilter"
import {
    PropertiesSortDropdown,
    sortPropertiesByPrice,
    type PropertySortOption,
} from "@/components/properties/propertiesSortDropdown"

type Tab = "pending-approvals" | "pending-exclusive"

export default function PendingApprovalsPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<Tab>("pending-approvals")
    const [globalFilter, setGlobalFilter] = useState("")
    const [priceSort, setPriceSort] = useState<PropertySortOption>("")
    const [propertyFilters, setPropertyFilters] = useState<PropertiesFilterState>(defaultPropertiesFilterState)
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
    const [properties, setProperties] = useState<PropertyCardData[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [actionMessage, setActionMessage] = useState<string | null>(null)

    const isSuperAdmin = user?.role === "SUPER_ADMIN"

    const fetchProperties = useCallback(async () => {
        const endpoint =
            activeTab === "pending-approvals"
                ? "/staff/properties/pending-approvals"
                : "/staff/properties/pending-exclusive"

        try {
            setIsLoading(true)
            setError(null)
            const params: Record<string, string | number> = { page: 1, limit: 50 }
            Object.assign(params, propertiesFilterToParams(propertyFilters))
            const [response, bookmarkIds] = await Promise.all([
                api.get<{ success: boolean; data: PropertyCardData[] }>(endpoint, { params }),
                fetchBookmarkedPropertyIds(),
            ])
            setProperties(response.data.data ?? [])
            setBookmarkedIds(bookmarkIds)
        } catch (err) {
            setError("Failed to load properties")
            setProperties([])
            if (activeTab === "pending-exclusive" && (err as { response?: { status?: number } })?.response?.status === 403) {
                setError("You do not have permission to view this section")
            }
            console.error("Failed to fetch pending properties:", err)
        } finally {
            setIsLoading(false)
        }
    }, [activeTab, propertyFilters])

    useEffect(() => {
        void fetchProperties()
    }, [fetchProperties])

    const filteredProperties = useMemo(() => {
        const query = globalFilter.trim().toLowerCase()
        const withBookmarkState = properties.map((p) => ({
            ...p,
            isBookmarked: bookmarkedIds.has(p.id),
        }))
        let result = propertyFilters.showOnlyBookmarked
            ? withBookmarkState.filter((p) => p.isBookmarked)
            : withBookmarkState
        if (query) {
            result = result.filter(
                (p) =>
                    p.title.toLowerCase().includes(query) ||
                    p.location.toLowerCase().includes(query) ||
                    p.status.toLowerCase().includes(query),
            )
        }
        return sortPropertiesByPrice(result, priceSort)
    }, [properties, globalFilter, priceSort, bookmarkedIds, propertyFilters.showOnlyBookmarked])

    const exportColumns: ExportColumn[] = [
        { key: "id", header: "ID" },
        { key: "title", header: "Title" },
        { key: "status", header: "Status" },
        { key: "location", header: "Location" },
        { key: "price", header: "Price" },
        { key: "area", header: "Area" },
        { key: "bedrooms", header: "Bedrooms" },
        { key: "bathrooms", header: "Bathrooms" },
        { key: "balconies", header: "Balconies" },
        { key: "floors", header: "Floors" },
        { key: "furnishing", header: "Furnishing" },
        { key: "postedDate", header: "Posted Date" },
    ]

    const handleToggleBookmark = useCallback(async (propertyId: string) => {
        const currentlyBookmarked = bookmarkedIds.has(propertyId)
        setBookmarkedIds((prev) => {
            const next = new Set(prev)
            if (currentlyBookmarked) next.delete(propertyId)
            else next.add(propertyId)
            return next
        })
        try {
            const nowBookmarked = await toggleBookmark(propertyId, currentlyBookmarked)
            setBookmarkedIds((prev) => {
                const next = new Set(prev)
                if (nowBookmarked) next.add(propertyId)
                else next.delete(propertyId)
                return next
            })
        } catch (err) {
            setBookmarkedIds((prev) => {
                const next = new Set(prev)
                if (currentlyBookmarked) next.add(propertyId)
                else next.delete(propertyId)
                return next
            })
            console.error("Failed to toggle bookmark:", err)
        }
    }, [bookmarkedIds])

    const handleMakeExclusive = (propertyId: string) => {
        router.push(`/property/make-it-exclusive/${propertyId}`)
    }

    const handleAcquisitionDecision = async (propertyId: string, decision: "APPROVED" | "REJECTED") => {
        if (!isSuperAdmin) return
        try {
            setActionMessage(null)
            await api.post("/staff/properties/acquisition-request-approval", { propertyId, decision })
            setActionMessage(`Request ${decision === "APPROVED" ? "approved" : "rejected"} successfully`)
            await fetchProperties()
        } catch (err) {
            console.error("Failed to process acquisition request:", err)
            setActionMessage(`Failed to ${decision === "APPROVED" ? "approve" : "reject"} request`)
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="font-medium text-xl p-2 pl-4">Pending Approvals</h1>
                <div className="flex items-center gap-4">
                    <Input
                        placeholder="Search Anything"
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="h-10 pl-9 border-2 bg-white"
                    />
                    <ExportButton
                        data={filteredProperties as unknown as Record<string, unknown>[]}
                        columns={exportColumns}
                        filename={activeTab === "pending-exclusive" ? "pending-exclusive-properties" : "pending-approvals"}
                    />
                    <PropertiesFilter
                        filters={propertyFilters}
                        onFiltersChange={setPropertyFilters}
                        showBookmarkOption
                    />
                    <PropertiesSortDropdown sort={priceSort} onSortChange={setPriceSort} />
                </div>
            </div>

            <div className="flex items-center gap-2 py-2  justify-center mt-2 border-b bg-zinc-200 rounded-xl w-88">
                <Button
                    variant={activeTab === "pending-approvals" ? "default" : "ghost"}
                    size="sm"
                    className={activeTab === "pending-approvals" ? "bg-blue-600 hover:bg-blue-700" : ""}
                    onClick={() => setActiveTab("pending-approvals")}
                >
                    Pending Approvals
                </Button>
                {isSuperAdmin && (
                    <Button
                        variant={activeTab === "pending-exclusive" ? "default" : "ghost"}
                        size="sm"
                        className={activeTab === "pending-exclusive" ? "bg-blue-600 hover:bg-blue-700" : ""}
                        onClick={() => setActiveTab("pending-exclusive")}
                    >
                        Pending Exclusive Properties
                    </Button>
                )}
            </div>

            <div className="flex gap-4 mt-4 px-2">
                {actionMessage && <p className="text-sm px-4 text-blue-600">{actionMessage}</p>}
                {isLoading && <p className="text-sm text-gray-500 px-4">Loading...</p>}
                {error && <p className="text-sm text-red-500 px-4">{error}</p>}
                {!isLoading && !error && (
                    <PropertyGrid
                        properties={filteredProperties}
                        variant="default"
                        showEditButton={false}
                        onEdit={undefined}
                        onFavorite={handleToggleBookmark}
                        onApprove={
                            activeTab === "pending-approvals" && isSuperAdmin
                                ? (id) => handleAcquisitionDecision(id, "APPROVED")
                                : undefined
                        }
                        onReject={
                            activeTab === "pending-approvals" && isSuperAdmin
                                ? (id) => handleAcquisitionDecision(id, "REJECTED")
                                : undefined
                        }
                        onMakeExclusive={
                            activeTab === "pending-exclusive" && isSuperAdmin
                                ? handleMakeExclusive
                                : undefined
                        }
                    />
                )}
            </div>
        </div>
    )
}
