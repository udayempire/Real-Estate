"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Pencil, Bookmark, ShoppingCart, CheckCircle, EyeOff, Eye, XCircle, Copy, Trash2 } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

const disabledBtnClass = "opacity-50 cursor-not-allowed grayscale"

interface PropertyActionBarProps {
    /** Property is bought by Realbro (status === SOLDTOREALBRO) */
    isBoughtByRealbro: boolean
    /** Property has exclusive listing */
    isExclusive: boolean
    /** For exclusive: exclusiveProperty.id (needed for edit link) */
    exclusivePropertyId?: string
    /** Property is listed (ACTIVE) vs unlisted (UNLISTED) */
    isListed: boolean
    /** Property is sold (any sold status) */
    isSold: boolean
    /** For exclusive: exclusive status ACTIVE/SOLD_OUT/ARCHIVED */
    exclusiveStatus?: string
    onListUnlist?: () => void | Promise<void>
    onMarkSold?: () => void | Promise<void>
    onBuy?: () => void | Promise<void>
    onBookmark?: () => void
    isBookmarked?: boolean
    onDelete?: () => void | Promise<void>
    onEmail?: () => void
    onWhatsApp?: () => void
}

export function PropertyActionBar({
    isBoughtByRealbro,
    isExclusive,
    exclusivePropertyId,
    isListed,
    isSold,
    exclusiveStatus,
    onListUnlist,
    onMarkSold,
    onBuy,
    onBookmark,
    isBookmarked = false,
    onDelete,
}: PropertyActionBarProps) {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const { user } = useAuth()
    const propertyId = Array.isArray(params?.id) ? params.id[0] : params?.id

    const isSuperAdmin = user?.role === "SUPER_ADMIN"
    const buyConfirmationText = isSuperAdmin
        ? "Are you sure you want to buy this property as RealBro?"
        : "Are you sure you want to request acquisition of this property?"

    const buyEnabled = !isBoughtByRealbro && !isExclusive
    const makeExclusiveEnabled = isBoughtByRealbro && isSuperAdmin
    /** Sold to RealBro but not yet exclusive: only Make it Exclusive + Bookmark are clickable */
    const soldToRealbroNotExclusive = isBoughtByRealbro && !isExclusive
    const listUnlistEnabled = !soldToRealbroNotExclusive && !!onListUnlist
    const markSoldEnabled = !soldToRealbroNotExclusive && !!onMarkSold
    /** Delete only when NOT exclusive and NOT sold to RealBro */
    const deleteEnabled = !isExclusive && !isBoughtByRealbro && !!onDelete

    const editHref = isExclusive && exclusivePropertyId
        ? `/property/exclusive-listings/${exclusivePropertyId}/edit`
        : `/property/all-listings/${propertyId}/edit`

    const isExclusiveSold = exclusiveStatus === "SOLD_OUT"
    const soldToggleLabel = isExclusive
        ? "Mark as Sold"
        : (isSold || isExclusiveSold ? "Mark as Available" : "Mark as Sold")
    const listUnlistLabel = isListed ? "Unlist Property" : "List Property"

    const [soldConfirmOpen, setSoldConfirmOpen] = useState(false)
    const [listConfirmOpen, setListConfirmOpen] = useState(false)
    const [isSubmittingListUnlist, setIsSubmittingListUnlist] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [buyDialogOpen, setBuyDialogOpen] = useState(false)
    const [isSubmittingBuy, setIsSubmittingBuy] = useState(false)

    const isMarkingSold = soldToggleLabel === "Mark as Sold"
    const isUnlisting = isListed

    const handleListUnlistConfirm = async () => {
        if (!onListUnlist) return
        try {
            setIsSubmittingListUnlist(true)
            await onListUnlist()
            setListConfirmOpen(false)
        } finally {
            setIsSubmittingListUnlist(false)
        }
    }

    const handleSoldConfirm = async () => {  
        await onMarkSold?.()
        setSoldConfirmOpen(false)
    }
    const handleDeleteConfirm = async () => {
        if (!onDelete) return
        setIsDeleting(true)
        try {
            await onDelete()
            setDeleteConfirmOpen(false)
        } finally {
            setIsDeleting(false)
        }
    }
    const handleConfirmBuy = async () => {
        if (!onBuy) return
        try {
            setIsSubmittingBuy(true)
            await onBuy()
            setBuyDialogOpen(false)
        } finally {
            setIsSubmittingBuy(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 mt-4">
                {isExclusive && (
                    <Button
                        variant="outline"
                        size="icon-sm"
                        className="border-2 shadow-none"
                        onClick={() => propertyId && router.push(editHref)}
                    >
                        <Pencil className="size-4" />
                    </Button>
                )}

                <Button
                    variant="outline"
                    size="sm"
                    className={`border-2 shadow-none gap-1.5 text-xs ${!listUnlistEnabled ? disabledBtnClass : ""}`}
                    onClick={() => listUnlistEnabled && setListConfirmOpen(true)}
                    disabled={!listUnlistEnabled}
                >
                    {isListed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    {listUnlistLabel}
                </Button>

                <Dialog open={listConfirmOpen} onOpenChange={setListConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Action</DialogTitle>
                            <DialogDescription>
                                {isUnlisting
                                    ? "Are you sure you want to unlist this property?"
                                    : "Are you sure you want to list this property?"}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setListConfirmOpen(false)}
                                disabled={isSubmittingListUnlist}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleListUnlistConfirm}
                                disabled={isSubmittingListUnlist || !onListUnlist}
                            >
                                {isSubmittingListUnlist ? "Processing..." : "Confirm"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Button
                    variant="outline"
                    size="sm"
                    className="border-2 shadow-none gap-1.5 text-xs"
                    onClick={onBookmark}
                >
                    <Bookmark className={`size-3.5 ${isBookmarked ? "fill-blue-600 text-blue-600" : "fill-none"}`} />
                    {isBookmarked ? "Bookmarked" : "Bookmark"}
                </Button>

                <Button
                    size="sm"
                    className={`gap-1.5 text-xs ${buyEnabled ? "bg-blue-600 hover:bg-blue-700" : `bg-gray-400 ${disabledBtnClass}`}`}
                    onClick={() => setBuyDialogOpen(true)}
                    disabled={!buyEnabled || !onBuy}
                >
                    <ShoppingCart className="size-3.5" />
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

                <Button
                    size="sm"
                    className={`gap-1.5 text-xs ${markSoldEnabled ? "bg-green-600 hover:bg-green-700" : `bg-gray-400 ${disabledBtnClass}`}`}
                    onClick={() => markSoldEnabled && setSoldConfirmOpen(true)}
                    disabled={!markSoldEnabled}
                >
                    {soldToggleLabel === "Mark as Sold" ? <CheckCircle className="size-3.5" /> : <XCircle className="size-3.5" />}
                    {soldToggleLabel}
                </Button>

                {deleteEnabled && (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-2 shadow-none gap-1.5 text-xs text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setDeleteConfirmOpen(true)}
                        >
                            <Trash2 className="size-3.5" />
                            Delete Property
                        </Button>
                        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Property</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete this property? This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteConfirm}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? "Deleting..." : "Delete"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </>
                )}

                <Dialog open={soldConfirmOpen} onOpenChange={setSoldConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm</DialogTitle>
                            <DialogDescription>
                                {isMarkingSold
                                    ? "Are you sure you want to mark this property as sold?"
                                    : "Are you sure you want to mark this property as available?"}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSoldConfirmOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                className={isMarkingSold ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
                                onClick={handleSoldConfirm}
                            >
                                Confirm
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <div className="my-2">
                    <div className="flex items-center gap-2">
                        <h1 ><span className="font-semibold">Property ID -</span> {propertyId} </h1>
                        <Copy className="size-5 cursor-pointer" onClick={() => navigator.clipboard.writeText(propertyId)} />
                    </div>
                </div>
            </div>


            {!isExclusive && (
                <Button
                    className={makeExclusiveEnabled ? "bg-blue-600 hover:bg-blue-700" : `bg-gray-400 ${disabledBtnClass}`}
                    onClick={() => propertyId && makeExclusiveEnabled && router.push(`/property/make-it-exclusive/${propertyId}`)}
                    disabled={!makeExclusiveEnabled}
                >
                    <CheckCircle className="size-3.5" />
                    Make It Exclusive
                </Button>
            )}
        </div>
    )
}
