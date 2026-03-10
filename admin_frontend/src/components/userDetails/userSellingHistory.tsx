"use client"

import { useState } from "react"
import { PropertyCard } from "./propertyCard"
import type { PropertyListing } from "./types"

const tabs = [
    { label: "Sold to Real Bro", key: "soldToRealBro" as const },
    { label: "Sold Exclusive Property", key: "soldFromExclusive" as const },
]

type Props = {
    soldToRealBro: PropertyListing[]
    soldFromExclusive: PropertyListing[]
}

export function UserSellingHistory({ soldToRealBro, soldFromExclusive }: Props) {
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>("soldToRealBro")

    const dataMap = { soldToRealBro, soldFromExclusive }
    const properties = dataMap[activeTab]

    return (
        <div className="space-y-3">
            <h1 className="font-medium mt-4 px-2 text-xl">Selling History</h1>
            <div className="flex gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${activeTab === tab.key
                                ? "bg-blue-500 text-white"
                                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                            }`}
                    >
                        {tab.label} ({dataMap[tab.key].length})
                    </button>
                ))}
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100svh-32rem)] pr-1">
                {properties.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No selling history</p>
                ) : (
                    properties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                    ))
                )}
            </div>
        </div>
    )
}
