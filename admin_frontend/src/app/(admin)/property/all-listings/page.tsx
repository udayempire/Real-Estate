"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
    PropertiesFilter,
    defaultPropertiesFilterState,
    propertiesFilterToParams,
    paramsToPropertiesFilterState,
    type PropertiesFilterState,
} from "@/components/properties/propertiesFilter"
import {
    PropertiesSortDropdown,
    sortPropertiesByPrice,
    type PropertySortOption,
} from "@/components/properties/propertiesSortDropdown"
import { ExportButton } from "@/components/role_management/exportButton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PropertyGrid } from "@/components/properties/propertyGrid"
// import { PendingApprovalList } from "@/components/properties/pendingApprovalList"
import type { PropertyCardData } from "@/components/properties/propertyCard"
import type { ExportColumn } from "@/components/role_management/exportButton"
// import type { PendingApprovalData } from "@/components/properties/pendingApprovalCard"
import { api } from "@/lib/api"
import { fetchBookmarkedPropertyIds, toggleBookmark } from "@/lib/bookmarks"
import { AxiosError } from "axios"
import { toast } from "sonner"

// const mockPendingApprovals: PendingApprovalData[] = [
//     { id: "p1", title: "3BHK Villa in Arera Colony", location: "Arera Colony, Bhopal", imageUrl: "/smallBuilding.png" },
// ]

export default function AllPropertiesPage() {
    const searchParams = useSearchParams()
    const initialFilters = useMemo(() => {
        const fromUrl = paramsToPropertiesFilterState(searchParams, { showOnlyBookmarked: false })
        const hasAnyParam = searchParams.has("category") || searchParams.has("propertyType") ||
            searchParams.has("furnishingStatus") || searchParams.has("priceMin") ||
            searchParams.has("priceMax") || searchParams.has("location")
        return hasAnyParam ? fromUrl : { ...defaultPropertiesFilterState, showOnlyBookmarked: false }
    }, [searchParams])
    const [globalFilter, setGlobalFilter] = useState("")
    const [propertyFilters, setPropertyFilters] = useState<PropertiesFilterState>(initialFilters)

    useEffect(() => {
        const hasAnyParam = searchParams.has("category") || searchParams.has("propertyType") ||
            searchParams.has("furnishingStatus") || searchParams.has("priceMin") ||
            searchParams.has("priceMax") || searchParams.has("location")
        if (hasAnyParam) {
            setPropertyFilters(paramsToPropertiesFilterState(searchParams, { showOnlyBookmarked: false }))
        }
    }, [searchParams])
    const [priceSort, setPriceSort] = useState<PropertySortOption>("")
    const [properties, setProperties] = useState<PropertyCardData[]>([])
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        const loadProperties = async () => {
            try {
                setIsLoading(true)
                setError(null)
                const params: Record<string, string | number> = { page: 1, limit: 20 }
                Object.assign(params, propertiesFilterToParams(propertyFilters))
                const [propertiesResponse, bookmarkIds] = await Promise.all([
                    api.get<{
                        success: boolean
                        data: PropertyCardData[]
                    }>("/staff/properties", { params }),
                    fetchBookmarkedPropertyIds(),
                ])

                if (!isMounted) return
                setProperties(propertiesResponse.data.data ?? [])
                setBookmarkedIds(bookmarkIds)
            } catch (err) {
                if (!isMounted) return
                setError("Failed to load properties")
                console.error("Failed to fetch properties:", err)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadProperties()
        return () => {
            isMounted = false
        }
    }, [propertyFilters])

    const filteredProperties = useMemo(() => {
        const query = globalFilter.trim().toLowerCase()
        const withBookmarkState = properties.map((property) => ({
            ...property,
            isBookmarked: bookmarkedIds.has(property.id),
        }))
        let result = propertyFilters.showOnlyBookmarked
            ? withBookmarkState.filter((property) => property.isBookmarked)
            : withBookmarkState
        if (query) {
            result = result.filter(
                (property) =>
                    property.title.toLowerCase().includes(query) ||
                    property.location.toLowerCase().includes(query) ||
                    property.status.toLowerCase().includes(query)
            )
        }
        return sortPropertiesByPrice(result, priceSort)
    }, [globalFilter, properties, bookmarkedIds, propertyFilters.showOnlyBookmarked, priceSort])

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

    const handleToggleBookmark = async (propertyId: string) => {
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
    }

    const handleBuyProperty = async (propertyId: string) => {
        try {
            const response = await api.post<{ message?: string }>("/staff/properties/acquisition-request", {
                propertyId,
            })
            toast.success(response.data.message ?? "Request submitted successfully", {
                position: "bottom-center",
            })
        } catch (err) {
            console.error("Failed to buy/request property:", err)
            const message =
                err instanceof AxiosError && (err.response?.data as { message?: string })?.message
                    ? String((err.response?.data as { message?: string }).message)
                    : "Failed to process property acquisition"
            toast.error(message, { position: "bottom-center" })
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="font-medium text-xl p-2 pl-4">User&apos;s Listings</h1>
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
                        filename="all-listings"
                    />
                    <PropertiesFilter
                        filters={propertyFilters}
                        onFiltersChange={setPropertyFilters}
                        showBookmarkOption
                    />
                    <PropertiesSortDropdown sort={priceSort} onSortChange={setPriceSort} />
                </div>
            </div>

            <div className="flex gap-4 mt-4 px-2">
                <div className="w-full">
                    {isLoading && <p className="text-sm text-gray-500">Loading properties...</p>}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {!isLoading && !error && filteredProperties.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <p className="text-muted-foreground text-center">
                                No properties found. Try adjusting your filters or clearing them to see all listings.
                            </p>
                            {(propertyFilters.category ||
                                propertyFilters.propertyType ||
                                propertyFilters.furnishingStatus ||
                                propertyFilters.priceMin ||
                                propertyFilters.priceMax ||
                                propertyFilters.location) && (
                                <Button
                                    variant="outline"
                                    onClick={() => setPropertyFilters({ ...defaultPropertiesFilterState, showOnlyBookmarked: propertyFilters.showOnlyBookmarked })}
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    )}
                    {!isLoading && !error && filteredProperties.length > 0 && (
                        <PropertyGrid
                            properties={filteredProperties}
                            onFavorite={handleToggleBookmark}
                            onBuy={handleBuyProperty}
                            showEditButton={false}
                        />
                    )}
                </div>
                {/* <div className="w-1/3">
                    <PendingApprovalList approvals={mockPendingApprovals} />
                </div> */}
            </div>
        </div>
    )
}
