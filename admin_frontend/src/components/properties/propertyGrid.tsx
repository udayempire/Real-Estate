"use client"

import { PropertyCard, PropertyCardData, PropertyCardVariant } from "./propertyCard"

interface PropertyGridProps {
    properties: PropertyCardData[]
    variant?: PropertyCardVariant
    onEdit?: (id: string) => void
    onBuy?: (id: string) => void
    onMarkAsSold?: (id: string) => void
    onFavorite?: (id: string) => void
}

export function PropertyGrid({ properties, variant = "default", onEdit, onBuy, onMarkAsSold, onFavorite }: PropertyGridProps) {
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
                        onFavorite={onFavorite}
                    />
                ))}
            </div>
        </div>
    )
}
