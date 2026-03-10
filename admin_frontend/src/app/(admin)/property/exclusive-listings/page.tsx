"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Filter } from "@/components/appointments/filterAppointments"
import { ExportButton } from "@/components/role_management/exportButton"
import { Input } from "@/components/ui/input"
import { PropertyGrid } from "@/components/properties/propertyGrid"
import { PendingApprovalList } from "@/components/properties/pendingApprovalList"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ChevronDown } from "lucide-react"
import type { PropertyCardData } from "@/components/properties/propertyCard"
import type { PendingApprovalData } from "@/components/properties/pendingApprovalCard"
import { api } from "@/lib/api"

// const mockPendingExclusiveApprovals: PendingApprovalData[] = [
//     { id: "p1", title: "3BHK Villa in Arera Colony", location: "Arera Colony, Bhopal", imageUrl: "/smallBuilding.png" },
//     { id: "p2", title: "3BHK Villa in Arera Colony", location: "Arera Colony, Bhopal", imageUrl: "/largeBuilding.png" },
//     { id: "p3", title: "3BHK Villa in Arera Colony", location: "Arera Colony, Bhopal", imageUrl: "/largeBuilding.png" },
//     { id: "p4", title: "3BHK Villa in Arera Colony", location: "Arera Colony, Bhopal", imageUrl: "/largeBuilding.png" },
//     { id: "p5", title: "3BHK Villa in Arera Colony", location: "Arera Colony, Bhopal", imageUrl: "/largeBuilding.png" },
//     { id: "p6", title: "3BHK Villa in Arera Colony", location: "Arera Colony, Bhopal", imageUrl: "/largeBuilding.png" },
// ]

type ExclusiveApiRow = {
    id: string
    title: string
    status: "ACTIVE" | "SOLD_OUT" | "ARCHIVED"
    listingPrice: number | null
    city: string | null
    locality: string | null
    subLocality: string | null
    numberOfRooms: number | null
    numberOfBathrooms: number | null
    numberOfBalcony: number | null
    numberOfFloors: number | null
    furnishingStatus: string | null
    createdAt: string
    fixedRewardGems: number
    media: Array<{ url: string }>
}

export default function ExclusivePropertiesPage() {
    const router = useRouter()
    const [globalFilter, setGlobalFilter] = useState("")
    const [exclusiveProperties, setExclusiveProperties] = useState<PropertyCardData[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let isMounted = true

        const fetchExclusiveProperties = async () => {
            try {
                setIsLoading(true)
                setError(null)
                const response = await api.get<{
                    success: boolean
                    data: ExclusiveApiRow[]
                }>("/staff/properties/exclusive", {
                    params: { page: 1, limit: 50 },
                })

                if (!isMounted) return

                const mapped: PropertyCardData[] = (response.data.data ?? []).map((item) => {
                    const uiStatus: PropertyCardData["status"] =
                        item.status === "ACTIVE"
                            ? "Active"
                            : item.status === "SOLD_OUT"
                                ? "Sold"
                                : "Unlisted"

                    const location = [item.subLocality, item.locality, item.city].filter(Boolean).join(", ") || "N/A"

                    return {
                        id: item.id,
                        title: item.title,
                        location,
                        price: item.listingPrice != null ? String(item.listingPrice) : "N/A",
                        area: "N/A",
                        bedrooms: item.numberOfRooms ?? 0,
                        bathrooms: item.numberOfBathrooms ?? 0,
                        balconies: item.numberOfBalcony ?? 0,
                        floors: item.numberOfFloors ?? 0,
                        furnishing: item.furnishingStatus?.replace(/([a-z])([A-Z])/g, "$1 $2") ?? "N/A",
                        status: uiStatus,
                        imageUrl: item.media?.[0]?.url ?? "/largeBuilding2.png",
                        postedDate: new Date(item.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                        }),
                        gems: item.fixedRewardGems,
                    }
                })

                setExclusiveProperties(mapped)
            } catch (err) {
                if (!isMounted) return
                setError("Failed to load exclusive properties")
                console.error("Failed to fetch exclusive properties:", err)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        fetchExclusiveProperties()
        return () => {
            isMounted = false
        }
    }, [])

    const filteredExclusiveProperties = useMemo(() => {
        const query = globalFilter.trim().toLowerCase()
        if (!query) return exclusiveProperties
        return exclusiveProperties.filter((property) =>
            property.title.toLowerCase().includes(query) ||
            property.location.toLowerCase().includes(query) ||
            property.status.toLowerCase().includes(query),
        )
    }, [exclusiveProperties, globalFilter])

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="font-medium text-xl p-2 pl-4">Exclusive Properties</h1>
                <div className="flex items-center gap-4">
                    <Input
                        placeholder="Search Anything"
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="h-10 pl-9 border-2 bg-white"
                    />
                    <ExportButton />
                    <Filter />
                    <Button variant="outline" className="hover:bg-zinc-50 gap-2 shadow-none border-2 h-10">
                        <ArrowUpDown className="size-4 text-blue-500" />
                        Sort by
                        <ChevronDown className="size-4" />
                    </Button>
                </div>
            </div>

            <div className="flex gap-4 mt-4 px-2">
                <div>
                    {isLoading && <p className="text-sm text-gray-500">Loading exclusive properties...</p>}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {!isLoading && !error && (
                        <PropertyGrid
                            properties={filteredExclusiveProperties}
                            variant="exclusive"
                            onEdit={(exclusivePropertyId) => router.push(`/property/exclusive-listings/${exclusivePropertyId}/edit`)}
                        />
                    )}
                </div>
                {/* <div className="w-1/3">
                    <PendingApprovalList
                        title="Pending Exclusive Approvals"
                        approvals={mockPendingExclusiveApprovals}
                    />
                </div> */}
            </div>
        </div>
    )
}
