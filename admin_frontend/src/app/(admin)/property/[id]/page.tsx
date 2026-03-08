"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { ParkingCircle } from "lucide-react"
import { PropertyImageCarousel } from "@/components/propertyDetails/propertyImageCarousel"
import { PropertyBrokerInfo } from "@/components/propertyDetails/propertyBrokerInfo"
import { PropertyActionBar } from "@/components/propertyDetails/propertyActionBar"
import { PropertyDetailsPanel } from "@/components/propertyDetails/propertyDetailsPanel"
import { PropertyAbout } from "@/components/propertyDetails/propertyAbout"
import type { BrokerInfoData } from "@/components/propertyDetails/propertyBrokerInfo"
import type { PropertyDetailsPanelData } from "@/components/propertyDetails/propertyDetailsPanel"
import { api } from "@/lib/api"
import { fetchBookmarkedPropertyIds, toggleBookmark } from "@/lib/bookmarks"

type PropertyResponse = {
    success: boolean
    data: {
        id: string
        title: string
        description: string | null
        propertyType: string | null
        status: string
        listingPrice: number | null
        priceMin: number | null
        priceMax: number | null
        state: string | null
        city: string | null
        locality: string | null
        subLocality: string | null
        flatNo: string | null
        area: string | null
        address: string | null
        latitude: number | null
        longitude: number | null
        carpetArea: number | null
        carpetAreaUnit: string | null
        plotLandArea: number | null
        plotLandAreaUnit: string | null
        size: number | null
        sizeUnit: string | null
        category: string | null
        furnishingStatus: string | null
        availabilityStatus: string | null
        ageOfProperty: string | null
        numberOfRooms: number | null
        numberOfBathrooms: number | null
        numberOfBalcony: number | null
        numberOfFloors: number | null
        propertyFloor: string | null
        allInclusivePrice: boolean
        negotiablePrice: boolean
        govtChargesTaxIncluded: boolean
        propertyFacing: string | null
        amenities: string[]
        locationAdvantages: string[]
        coveredParking: number
        uncoveredParking: number
        createdAt: string
        updatedAt: string
        userId: string
        media: Array<{
            id: string
            url: string
            key: string
            mediaType: string
            order: number
            createdAt: string
            propertyId: string
        }>
        user: {
            id: string
            firstName: string
            lastName: string
            email: string
            phone: string
        }
        exclusiveProperty: {
            id: string
            fixedRewardGems: number
            status: string
        } | null
    }
}

const FALLBACK_IMAGE = "/largeBuilding2.png"

export default function PropertyPage() {
    const params = useParams<{ id: string }>()
    const propertyId = Array.isArray(params?.id) ? params.id[0] : params?.id
    const [property, setProperty] = useState<PropertyResponse["data"] | null>(null)
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!propertyId) {
            setError("Invalid property id")
            return
        }

        let isMounted = true

        const loadProperty = async () => {
            try {
                setIsLoading(true)
                setError(null)
                const [response, bookmarkIds] = await Promise.all([
                    api.get<PropertyResponse>(`/staff/properties/${propertyId}`),
                    fetchBookmarkedPropertyIds(),
                ])
                if (!isMounted) return
                setProperty(response.data.data)
                setIsBookmarked(bookmarkIds.has(propertyId))
            } catch (err) {
                if (!isMounted) return
                setError("Failed to load property details")
                console.error("Failed to fetch property details:", err)
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        loadProperty()
        return () => {
            isMounted = false
        }
    }, [propertyId])

    const handleToggleBookmark = async () => {
        if (!property) return
        const previous = isBookmarked
        setIsBookmarked(!previous)
        try {
            const nowBookmarked = await toggleBookmark(property.id, previous)
            setIsBookmarked(nowBookmarked)
        } catch (err) {
            setIsBookmarked(previous)
            console.error("Failed to toggle bookmark:", err)
        }
    }

    const images = useMemo(() => {
        if (!property?.media?.length) return [FALLBACK_IMAGE]
        return property.media.map((item) => item.url)
    }, [property])

    const broker = useMemo<BrokerInfoData>(() => {
        if (!property) {
            return {
                name: "RealBro",
                logoUrl: FALLBACK_IMAGE,
                isVerified: true,
                postedDate: "-",
            }
        }
        const name = `${property.user.firstName} ${property.user.lastName}`.trim()
        return {
            name: name || "RealBro",
            logoUrl: FALLBACK_IMAGE,
            isVerified: true,
            postedDate: new Date(property.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }),
        }
    }, [property])

    const details = useMemo<PropertyDetailsPanelData | null>(() => {
        if (!property) return null

        const statusMap: Record<string, string> = {
            ACTIVE: "Active",
            UNLISTED: "Unlisted",
            DRAFT: "Pending",
            UNDER_ACQUISITION: "Pending",
            SOLDOFFLINE: "Sold",
            SOLDTOREALBRO: "Sold",
            SOLDFROMLISTINGS: "Sold",
        }
        const location = [property.subLocality, property.locality, property.city].filter(Boolean).join(", ")
        const areaSqftValue = property.carpetArea ?? property.size ?? 0
        const areaSqmValue = areaSqftValue ? (areaSqftValue * 0.092903).toFixed(0) : "0"

        return {
            status: statusMap[property.status] ?? property.status,
            statusLabel: property.availabilityStatus?.replace(/([a-z])([A-Z])/g, "$1 $2"),
            title: property.title,
            location: location || "N/A",
            tags: [
                property.category ? { label: property.category, icon: "residential" as const } : null,
                property.propertyType ? { label: property.propertyType, icon: "apartment" as const } : null,
                property.ageOfProperty ? { label: property.ageOfProperty, icon: "age" as const } : null,
                property.furnishingStatus ? { label: property.furnishingStatus.replace(/([a-z])([A-Z])/g, "$1 $2"), icon: "furnishing" as const } : null,
                property.propertyFacing ? { label: property.propertyFacing.replace(/([a-z])([A-Z])/g, "$1 $2"), icon: "facing" as const } : null,
            ].filter((tag): tag is NonNullable<typeof tag> => Boolean(tag)),
            specs: {
                price: property.listingPrice != null ? String(property.listingPrice) : "0",
                pricePerSqft:
                    property.listingPrice != null && areaSqftValue > 0
                        ? String(Math.round(property.listingPrice / areaSqftValue))
                        : "0",
                areaSqft: `${areaSqftValue} sqft`,
                areaSqm: `${areaSqmValue} sqm`,
                rooms: property.numberOfRooms ?? 0,
                bathrooms: property.numberOfBathrooms ?? 0,
                balcony: property.numberOfBalcony ?? 0,
                floors: property.numberOfFloors ?? 0,
            },
        }
    }, [property])

    return (
        <div>
            <h1 className="font-medium text-xl p-2 pl-4">Property Details</h1>
            {isLoading && <p className="px-4 text-sm text-gray-500">Loading property details...</p>}
            {error && <p className="px-4 text-sm text-red-500">{error}</p>}

            {!isLoading && !error && property && details && (
                <div className="flex gap-6 mt-4 px-4">
                <div className="w-1/2">
                    <PropertyImageCarousel
                        images={images}
                        isExclusive={Boolean(property.exclusiveProperty)}
                        gems={property.exclusiveProperty?.fixedRewardGems}
                    />
                    <PropertyBrokerInfo broker={broker} />
                    <PropertyActionBar
                        variant={property.exclusiveProperty ? "exclusive" : "default"}
                        isBookmarked={isBookmarked}
                        onBookmark={handleToggleBookmark}
                    />
                </div>

                <div className="w-1/2">
                    <PropertyDetailsPanel data={details} />
                    <PropertyAbout description={property.description || "No description provided."} />
                    <div className="mt-5 border rounded-xl p-4">
                        <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                            <ParkingCircle className="size-4 text-gray-600" />
                            Parking Details
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="border rounded-lg p-3">
                                <p className="text-gray-500">Covered Parking</p>
                                <p className="font-semibold text-base">{property.coveredParking ?? 0}</p>
                            </div>
                            <div className="border rounded-lg p-3">
                                <p className="text-gray-500">Uncovered Parking</p>
                                <p className="font-semibold text-base">{property.uncoveredParking ?? 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    )
}
