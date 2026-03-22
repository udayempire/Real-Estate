"use client"

import { div } from "framer-motion/client"
import {
    MapPin,
    Home,
    Building2,
    Clock,
    Sofa,
    Compass,
    BedDouble,
    Bath,
    Sun,
    Layers,
    Gem,
} from "lucide-react"

export interface PropertyTag {
    label: string
    icon?: "residential" | "apartment" | "age" | "furnishing" | "facing"
}

export interface PropertySpecs {
    price: string
    pricePerSqft: string
    areaSqft: string
    areaSqm: string
    rooms: number
    bathrooms: number
    balcony: number
    floors: number
}

export interface PropertyDetailsPanelData {
    status: string
    statusLabel?: string
    isExtraRewardOn?: boolean
    title: string
    location: string
    tags: PropertyTag[]
    specs: PropertySpecs
}

interface PropertyDetailsPanelProps {
    data: PropertyDetailsPanelData
}

const tagIcons = {
    residential: Home,
    apartment: Building2,
    age: Clock,
    furnishing: Sofa,
    facing: Compass,
}

export function PropertyDetailsPanel({ data }: PropertyDetailsPanelProps) {
    return (
        <div>
            <div className="flex items-center gap-2">
                <span className="bg-green-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    {data.status}
                </span>
                {data.statusLabel && (
                    <span className="bg-blue-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full">  
                        {data.statusLabel}
                    </span>
                )}
                {data.isExtraRewardOn && (
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-3 bg-purple-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                        <Gem className="size-3.5 text-white" />
                            Extra Rewards
                        </span>
                    </div>
                )}
            </div>

            <h1 className="font-bold text-xl mt-3">{data.title}</h1>
            <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                <MapPin className="size-3.5" />
                {data.location}
            </p>

            <h3 className="font-semibold text-base mt-5">Property Details</h3>
            <div className="flex flex-wrap gap-2 mt-3">
                {data.tags.map((tag) => {
                    const IconComp = tag.icon ? tagIcons[tag.icon] : Home
                    return (
                        <span
                            key={tag.label}
                            className="border border-teal-300 text-teal-700 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 bg-teal-50/50"
                        >
                            <IconComp className="size-3.5" />
                            {tag.label}
                        </span>
                    )
                })}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="border rounded-xl p-4 space-y-3">
                    <div className="text-center">
                        <p className="font-bold text-lg">₹{data.specs.price}</p>
                        <p className="text-gray-400 text-xs">₹{data.specs.pricePerSqft}</p>
                    </div>
                    <div className="border-t border-dashed" />
                    <div className="text-center">
                        <p className="font-bold text-lg">{data.specs.areaSqft}</p>
                        <p className="text-gray-400 text-xs">{data.specs.areaSqm}</p>
                    </div>
                </div>

                <div className="border rounded-xl p-4 grid grid-cols-2 gap-y-4 gap-x-3">
                    <div className="text-center">
                        <p className="text-gray-400 text-[11px] font-medium">Rooms</p>
                        <p className="font-bold text-sm flex items-center justify-center gap-1 mt-0.5">
                            <BedDouble className="size-3.5 text-gray-500" />
                            {data.specs.rooms}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400 text-[11px] font-medium">Bathrooms</p>
                        <p className="font-bold text-sm flex items-center justify-center gap-1 mt-0.5">
                            <Bath className="size-3.5 text-gray-500" />
                            {data.specs.bathrooms}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400 text-[11px] font-medium">Balcony</p>
                        <p className="font-bold text-sm flex items-center justify-center gap-1 mt-0.5">
                            <Sun className="size-3.5 text-gray-500" />
                            {data.specs.balcony}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400 text-[11px] font-medium">Floors</p>
                        <p className="font-bold text-sm flex items-center justify-center gap-1 mt-0.5">
                            <Layers className="size-3.5 text-gray-500" />
                            {data.specs.floors}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
