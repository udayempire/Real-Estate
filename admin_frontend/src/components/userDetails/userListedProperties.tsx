"use client"

import { useState } from "react"
import { PropertyCard } from "./propertyCard"
import type { PropertiesByStatus } from "./types"

const tabs = [
    { label: "All", key: "all" as const },
    { label: "Active", key: "active" as const },
    { label: "Unlisted", key: "unlisted" as const },
    { label: "Sold to RealBro", key: "soldToRealBro" as const },
    { label: "Sold Exclusive", key: "soldFromExclusive" as const },
]

export function UserListedProperties({ propertiesByStatus }: { propertiesByStatus: PropertiesByStatus }) {
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>("all")

    const properties = propertiesByStatus[activeTab]

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-lg font-semibold mb-3">Listed Properties</h2>
            <div className="flex gap-2 flex-wrap mb-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                            activeTab === tab.key
                                ? "bg-blue-500 text-white"
                                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        {tab.label} ({propertiesByStatus[tab.key].length})
                    </button>
                ))}
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
                {properties.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No properties found</p>
                ) : (
                    properties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                    ))
                )}
            </div>
        </div>
    )
}
