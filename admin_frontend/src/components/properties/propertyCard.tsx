"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import {
    CalendarDays,
    Ruler,
    MapPin,
    BedDouble,
    Bath,
    Sun,
    Layers,
    Sofa,
    Pencil,
    ShoppingCart,
    CheckCircle,
    XCircle,
    Gem,
    Crown,
    Bookmark,
} from "lucide-react"

const MakeExclusiveIcon = Crown

export interface PropertyCardData {
    id: string
    /** When set (e.g. for exclusive listings), use this for /property/:id link instead of id */
    detailId?: string
    title: string
    location: string
    price: string
    area: string
    bedrooms: number
    bathrooms: number
    balconies: number
    floors: number
    furnishing: string
    /** Backend status: PropertyStatus (User's Listing, Pending) or ExclusivePropertyStatus (Exclusive tab) */
    status: string
    imageUrl: string
    postedDate: string
    isFeatured?: boolean
    gems?: number
    isBookmarked?: boolean
}

export type PropertyCardVariant = "default" | "exclusive"

interface PropertyCardProps {
    property: PropertyCardData
    variant?: PropertyCardVariant
    onEdit?: (id: string) => void
    onBuy?: (id: string) => void | Promise<void>
    onMarkAsSold?: (id: string) => void
    onApprove?: (id: string) => void | Promise<void>
    onReject?: (id: string) => void | Promise<void>
    onMakeExclusive?: (id: string) => void
    onFavorite?: (id: string) => void
    /** When false, hides the Edit button (e.g. on User's Listings page) */
    showEditButton?: boolean
}

/** PropertyStatus + ExclusivePropertyStatus color mapping */
const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-500",
    UNLISTED: "bg-gray-500",
    SOLDOFFLINE: "bg-red-500",
    SOLDTOREALBRO: "bg-blue-500",
    SOLDFROMLISTINGS: "bg-teal-500",
    DRAFT: "bg-yellow-500",
    SOLDEXCLUSIVEPROPERTY: "bg-purple-500",
    PENDING_EXCLUSIVE_ACQUISITION: "bg-amber-500",
    SOLD_OUT: "bg-red-500",
}
const defaultStatusColor = "bg-gray-500"

/** Display label for status (e.g. SOLD_OUT → "SOLD OUT") */
function formatStatusLabel(status: string): string {
    if (status === "SOLD_OUT") return "SOLD OUT"
    return status
}

export function PropertyCard({
    property,
    variant = "default",
    onEdit,
    onBuy,
    onMarkAsSold,
    onApprove,
    onReject,
    onMakeExclusive,
    onFavorite,
    showEditButton = true,
}: PropertyCardProps) {
    const router = useRouter()
    const isExclusive = variant === "exclusive"
    const { user } = useAuth()
    const [buyDialogOpen, setBuyDialogOpen] = useState(false)
    const [isSubmittingBuy, setIsSubmittingBuy] = useState(false)
    const [approveDialogOpen, setApproveDialogOpen] = useState(false)
    const [isSubmittingApprove, setIsSubmittingApprove] = useState(false)
    const [soldConfirmOpen, setSoldConfirmOpen] = useState(false)
    const [isSubmittingSold, setIsSubmittingSold] = useState(false)

    const isSuperAdmin = user?.role === "SUPER_ADMIN"
    const buyConfirmationText = isSuperAdmin
        ? "Are you sure you want to buy this property as RealBro?"
        : "Are you sure you want to request acquisition of this property?"

    const handleConfirmBuy = async () => {
        if (!onBuy) return
        try {
            setIsSubmittingBuy(true)
            await onBuy(property.id)
            setBuyDialogOpen(false)
        } finally {
            setIsSubmittingBuy(false)
        }
    }

    const handleConfirmSold = async () => {
        if (!onMarkAsSold) return
        try {
            setIsSubmittingSold(true)
            await onMarkAsSold(property.detailId ?? property.id)
            setSoldConfirmOpen(false)
        } finally {
            setIsSubmittingSold(false)
        }
    }

    const handleConfirmApprove = async () => {
        if (!onApprove) return
        try {
            setIsSubmittingApprove(true)
            await onApprove(property.id)
            setApproveDialogOpen(false)
        } finally {
            setIsSubmittingApprove(false)
        }
    }

    const propertyDetailsHref = `/property/${property.detailId ?? property.id}`
    const handleEditClick = () => {
        if (onEdit) {
            onEdit(property.id)
            return
        }
        if (isExclusive) {
            router.push(`/property/exclusive-listings/${property.id}/edit`)
        }
    }

    return (
        <Card className="border py-0 gap-0 overflow-hidden">
            <div className="relative">
                <Link href={propertyDetailsHref}>
                    <Image
                        src={property.imageUrl}
                        alt={property.title}
                        width={400}
                        height={200}
                        className="w-full h-44 object-cover"
                    />
                </Link>
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className={`${statusColors[property.status] ?? defaultStatusColor} text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1`}>
                        <span className="w-1.5 h-1.5 bg-white rounded-full" />
                        {formatStatusLabel(property.status)}
                    </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                        onClick={() => onFavorite?.(property.detailId ?? property.id)}
                        className="h-7 w-7 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition"
                    >
                        <Bookmark
                            className={`size-3.5 ${property.isBookmarked ? "text-blue-600 fill-blue-600" : "fill-none"}`}
                        />
                    </button>

                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                    {isExclusive && (
                        <span className="bg-blue-600 text-white text-[10px] font-semibold p-1 rounded-md">
                            <Crown className="size-3.5" />
                        </span>
                    )}
                </div>
                {property.gems && (
                    <div className="absolute bottom-3 right-3">
                        <span className="bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Gem className="size-3" />
                            {property.gems.toLocaleString()}
                        </span>
                    </div>
                )}
            </div>

            <div className="p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
                    <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {property.postedDate}
                    </span>
                    <span className="flex items-center gap-1">
                        <Ruler className="size-3" />
                        {property.area}
                    </span>
                </div>

                <div>
                    <h3 className="font-semibold text-sm">{property.title}</h3>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="size-3" />
                        {property.location}
                    </p>
                </div>

                <div className="flex items-center justify-between">
                    <p className="font-bold text-base">₹ {property.price}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-gray-500 text-[11px]">
                        <span className="flex items-center gap-1">
                            <BedDouble className="size-3.5" />
                            {property.bedrooms}
                        </span>
                        <span className="flex items-center gap-1">
                            <Bath className="size-3.5" />
                            {property.bathrooms}
                        </span>
                        <span className="flex items-center gap-1">
                            <Sun className="size-3.5" />
                            {property.balconies}
                        </span>
                        <span className="flex items-center gap-1">
                            <Layers className="size-3.5" />
                            {property.floors}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-blue-500 font-medium">
                    <Sofa className="size-3.5" />
                    {property.furnishing}
                </div>

                <div className="flex items-center gap-2 pt-1">
                    {onMakeExclusive ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-[11px] text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => onMakeExclusive(property.id)}
                        >
                            <MakeExclusiveIcon className="size-3 mr-1" />
                            Make it Exclusive
                        </Button>
                    ) : showEditButton && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-[11px] text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={handleEditClick}
                        >
                            <Pencil className="size-3 mr-1" />
                            Edit
                        </Button>
                    )}

                    {!onMakeExclusive && (onApprove || onReject) ? (
                        <>
                            {onApprove && (
                                <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 h-8 text-[11px] text-green-700 border-green-300 hover:bg-green-50"
                                        >
                                            <CheckCircle className="size-3 mr-1" />
                                            Approve
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Confirm Approval</DialogTitle>
                                            <DialogDescription>
                                                Are you sure you want to approve this property?
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button
                                                variant="outline"
                                                onClick={() => setApproveDialogOpen(false)}
                                                disabled={isSubmittingApprove}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleConfirmApprove}
                                                disabled={isSubmittingApprove || !onApprove}
                                            >
                                                {isSubmittingApprove ? "Processing..." : "Approve"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                            {onReject && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-8 text-[11px] text-red-700 border-red-300 hover:bg-red-50"
                                    onClick={() => void onReject(property.id)}
                                >
                                    <XCircle className="size-3 mr-1" />
                                    Reject
                                </Button>
                            )}
                        </>
                    ) : !onMakeExclusive && isExclusive ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-[11px] text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => setSoldConfirmOpen(true)}
                            >
                                {property.status === "SOLD_OUT" ? (
                                    <>
                                        <XCircle className="size-3 mr-1" />
                                        Mark as Available
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="size-3 mr-1" />
                                        Mark as Sold
                                    </>
                                )}
                            </Button>
                            <Dialog open={soldConfirmOpen} onOpenChange={setSoldConfirmOpen}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Confirm</DialogTitle>
                                        <DialogDescription>
                                            {property.status === "SOLD_OUT"
                                                ? "Are you sure you want to mark this property as available?"
                                                : "Are you sure you want to mark this property as sold?"}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setSoldConfirmOpen(false)}
                                            disabled={isSubmittingSold}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={handleConfirmSold}
                                            disabled={isSubmittingSold || !onMarkAsSold}
                                        >
                                            {isSubmittingSold ? "Processing..." : "Confirm"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    ) : !onMakeExclusive && property.status === "ACTIVE" ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-[11px] text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => setBuyDialogOpen(true)}
                            >
                                <ShoppingCart className="size-3 mr-1" />
                                Buy Property
                            </Button>
                            <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Confirm Action</DialogTitle>
                                        <DialogDescription>
                                            {buyConfirmationText}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setBuyDialogOpen(false)}
                                            disabled={isSubmittingBuy}
                                        >
                                            Cancel
                                        </Button>
                                        <Button onClick={handleConfirmBuy} disabled={isSubmittingBuy || !onBuy}>
                                            {isSubmittingBuy ? "Processing..." : "Confirm"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </>
                    ) : !onMakeExclusive ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-[11px] text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => onMarkAsSold?.(property.id)}
                        >
                            <CheckCircle className="size-3 mr-1" />
                            Mark as Sold
                        </Button>
                    ) : null}
                </div>
            </div>
        </Card>
    )
}
