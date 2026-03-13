"use client"

import { PropertyCard, PropertyCardData, PropertyCardVariant } from "./propertyCard"

interface PropertyGridProps {
    properties: PropertyCardData[]
    variant?: PropertyCardVariant
    onEdit?: (id: string) => void
    onBuy?: (id: string) => void
    onMarkAsSold?: (id: string) => void
    onApprove?: (id: string) => void
    onReject?: (id: string) => void
    onMakeExclusive?: (id: string) => void
    onFavorite?: (id: string) => void
    /** When false, hides the Edit button on each card (e.g. on User's Listings page) */
    showEditButton?: boolean
}

export function PropertyGrid({
    properties,
    variant = "default",
    onEdit,
    onBuy,
    onMarkAsSold,
    onApprove,
    onReject,
    onMakeExclusive,
    onFavorite,
    showEditButton = true,
}: PropertyGridProps) {
    return (
        <div className=" pr-2" style={{ maxHeight: "calc(100vh - 140px)" }}>
            <div className="grid grid-cols-3 gap-4">
                {properties.map((property) => (
                    <PropertyCard
                        key={property.id}
                        property={property}
                        variant={variant}
                        onEdit={onEdit}
                        onBuy={onBuy}
                        onMarkAsSold={onMarkAsSold}
                        onApprove={onApprove}
                        onReject={onReject}
                        onMakeExclusive={onMakeExclusive}
                        onFavorite={onFavorite}
                        showEditButton={showEditButton}
                    />
                ))}
            </div>
        </div>
    )
}
