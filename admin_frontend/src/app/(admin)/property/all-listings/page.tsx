"use client"

import { useEffect, useMemo, useState } from "react"
import { Filter } from "@/components/appointments/filterAppointments"
import { ExportButton } from "@/components/role_management/exportButton"
import { Input } from "@/components/ui/input"
import { PropertyGrid } from "@/components/properties/propertyGrid"
// import { PendingApprovalList } from "@/components/properties/pendingApprovalList"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ChevronDown } from "lucide-react"
import type { PropertyCardData } from "@/components/properties/propertyCard"
// import type { PendingApprovalData } from "@/components/properties/pendingApprovalCard"
import { api } from "@/lib/api"
import { fetchBookmarkedPropertyIds, toggleBookmark } from "@/lib/bookmarks"

// const mockPendingApprovals: PendingApprovalData[] = [
//     { id: "p1", title: "3BHK Villa in Arera Colony", location: "Arera Colony, Bhopal", imageUrl: "/smallBuilding.png" },
// ]

export default function AllPropertiesPage() {
    const [globalFilter, setGlobalFilter] = useState("")
    const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false)
    const [properties, setProperties] = useState<PropertyCardData[]>([])
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [actionMessage, setActionMessage] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        const loadProperties = async () => {
            try {
                setIsLoading(true)
                setError(null)
                const [propertiesResponse, bookmarkIds] = await Promise.all([
                    api.get<{
                        success: boolean
                        data: PropertyCardData[]
                    }>("/staff/properties", {
                        params: { page: 1, limit: 20 },
                    }),
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
    }, [])

    const filteredProperties = useMemo(() => {
        const query = globalFilter.trim().toLowerCase()
        const withBookmarkState = properties.map((property) => ({
            ...property,
            isBookmarked: bookmarkedIds.has(property.id),
        }))
        const filteredByBookmark = showOnlyBookmarked
            ? withBookmarkState.filter((property) => property.isBookmarked)
            : withBookmarkState
        if (!query) return filteredByBookmark

        return filteredByBookmark.filter((property) => {
            return (
                property.title.toLowerCase().includes(query) ||
                property.location.toLowerCase().includes(query) ||
                property.status.toLowerCase().includes(query)
            )
        })
    }, [globalFilter, properties, bookmarkedIds, showOnlyBookmarked])

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
        setActionMessage(null)
        try {
            const response = await api.post<{ message?: string }>("/staff/properties/acquisition-request", {
                propertyId,
            })
            setActionMessage(response.data.message ?? "Request submitted successfully")
        } catch (err) {
            console.error("Failed to buy/request property:", err)
            setActionMessage("Failed to process property acquisition")
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="font-medium text-xl p-2 pl-4">All Listings</h1>
                <div className="flex items-center gap-4">
                    <Input
                        placeholder="Search Anything"
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="h-10 pl-9 border-2 bg-white"
                    />
                    <ExportButton />
                    <Filter
                        showOnlyBookmarked={showOnlyBookmarked}
                        onToggleBookmarked={(checked) => setShowOnlyBookmarked(checked)}
                    />
                    <Button variant="outline" className="hover:bg-zinc-50 gap-2 shadow-none border-2 h-10">
                        <ArrowUpDown className="size-4 text-blue-500" />
                        Sort by
                        <ChevronDown className="size-4" />
                    </Button>
                </div>
            </div>

            <div className="flex gap-4 mt-4 px-2">
                <div className="w-full">
                    {actionMessage && <p className="text-sm text-blue-600 mb-2">{actionMessage}</p>}
                    {isLoading && <p className="text-sm text-gray-500">Loading properties...</p>}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {!isLoading && !error && (
                        <PropertyGrid
                            properties={filteredProperties}
                            onFavorite={handleToggleBookmark}
                            onBuy={handleBuyProperty}
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
