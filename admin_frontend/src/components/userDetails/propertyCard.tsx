"use client"

import Image from "next/image"
import { MapPin, Calendar, Scaling, ImageOff } from "lucide-react"
import type { PropertyListing, PropertyStatus } from "./types"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"

const statusLabel: Record<PropertyStatus, string> = {
    ACTIVE: "Active",
    UNLISTED: "Unlisted",
    SOLDTOREALBRO: "Sold to RealBro",
    SOLDEXCLUSIVEPROPERTY: "Sold Exclusive",
    SOLDOFFLINE: "Sold Offline",
    SOLDFROMLISTINGS: "Sold from Listings",
    DRAFT: "Draft",
}

const statusColor: Record<PropertyStatus, string> = {
    ACTIVE: "bg-green-500/20 text-green-700",
    UNLISTED: "bg-gray-500/20 text-gray-700",
    SOLDTOREALBRO: "bg-blue-500/20 text-blue-700",
    SOLDEXCLUSIVEPROPERTY: "bg-purple-500/20 text-purple-700",
    SOLDOFFLINE: "bg-orange-500/20 text-orange-700",
    SOLDFROMLISTINGS: "bg-teal-500/20 text-teal-700",
    DRAFT: "bg-yellow-500/20 text-yellow-700",
}

function formatPrice(value: number | null): string {
    if (value == null) return "N/A"
    if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(1)} Cr`
    if (value >= 100000) return `₹ ${(value / 100000).toFixed(1)} Lakh`
    if (value >= 1000) return `₹ ${(value / 1000).toFixed(1)}K`
    return `₹ ${value}`
}

function formatArea(property: PropertyListing): string {
    if (property.carpetArea && property.carpetAreaUnit) {
        return `${property.carpetArea} ${property.carpetAreaUnit.toLowerCase()}`
    }
    if (property.plotLandArea && property.plotLandAreaUnit) {
        return `${property.plotLandArea} ${property.plotLandAreaUnit.toLowerCase()}`
    }
    return "N/A"
}

function formatLocation(property: PropertyListing): string {
    return [property.locality, property.city, property.state]
        .filter(Boolean)
        .join(", ") || "N/A"
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })
}

export function PropertyCard({ property }: { property: PropertyListing }) {
    const { user } = useAuth()
    const canOpenPropertyDetails = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"

    const detailsContent = (
        <>
            <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold leading-tight truncate">{property.title}</h4>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        {formatLocation(property)}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3 shrink-0" />
                        {formatDate(property.createdAt)}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
                <span className="font-bold">{formatPrice(property.listingPrice)}</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                    <Scaling className="size-3.5" />
                    {formatArea(property)}
                </span>
            </div>
        </>
    )

    return (
        <div className="flex gap-3 rounded-xl border bg-white p-3">
            <div className="relative shrink-0 w-32 h-24 rounded-lg overflow-hidden bg-gray-100">
                {property.media?.[0]?.url ? (
                    <Image
                        src={property.media[0].url}
                        alt={property.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <ImageOff className="size-6 text-gray-400" />
                    </div>
                )}
                <span className={`absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor[property.status]}`}>
                    <span className="size-1.5 rounded-full bg-current" />
                    <p className="text-black">{statusLabel[property.status]}</p>
                </span>
            </div>

            {canOpenPropertyDetails ? (
                <Link href={`/property/${property.id}`} className="flex flex-1 flex-col justify-between min-w-0 cursor-pointer">
                    {detailsContent}
                </Link>
            ) : (
                <div className="flex flex-1 flex-col justify-between min-w-0 cursor-default" aria-disabled="true">
                    {detailsContent}
                </div>
            )}
        </div>
    )
}
