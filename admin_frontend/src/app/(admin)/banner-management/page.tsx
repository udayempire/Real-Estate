"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { AxiosError } from "axios"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoreVertical, Calendar, Clock, Plus, Image as ImageIcon, AlertCircleIcon } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type BannerApiItem = {
    id: string
    title: string | null
    image: string
    imageKey: string
    status: "ACTIVE" | "INACTIVE"
    createdAt: string
    updatedAt: string
}

function formatDateTime(date: string) {
    const d = new Date(date)
    return {
        date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true }),
    }
}

function BannerList({
    title,
    banners,
    isInactive = false,
    onToggleStatus,
    onDelete,
    onPreview,
}: {
    title: string
    banners: BannerApiItem[]
    isInactive?: boolean
    onToggleStatus: (id: string, nextStatus: "ACTIVE" | "INACTIVE") => void
    onDelete: (id: string) => void
    onPreview: (banner: BannerApiItem) => void
}) {
    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                <span className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1 rounded-full">
                    {banners.length} {banners.length === 1 ? "Banner" : "Banners"}
                </span>
            </div>

            {banners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-xl bg-muted/20">
                    <ImageIcon className="size-10 text-muted-foreground mb-3 opacity-50" />
                    <p className="text-sm font-medium text-muted-foreground">No banners found here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {banners.map((banner) => {
                        const { date, time } = formatDateTime(banner.createdAt)
                        return (
                            <div 
                                key={banner.id} 
                                className={`group flex flex-col border rounded-xl overflow-hidden bg-card text-card-foreground transition-all hover:shadow-md ${isInactive ? 'opacity-80 hover:opacity-100 grayscale-[0.2]' : ''}`}
                            >
                                <div className="relative aspect-video overflow-hidden bg-muted">
                                    <Image
                                        src={banner.image}
                                        alt={banner.title ?? "Banner"}
                                        width={600}
                                        height={320}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                                        onClick={() => onPreview(banner)}
                                    />
                                    <div className="absolute top-2 right-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="size-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreVertical className="size-4 text-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {banner.status === "ACTIVE" ? (
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive font-medium" onClick={() => onToggleStatus(banner.id, "INACTIVE")}>
                                                        Mark as Inactive
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600 font-medium" onClick={() => onToggleStatus(banner.id, "ACTIVE")}>
                                                        Mark as Active
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        onDelete(banner.id)
                                                    }}
                                                >
                                                    Delete Banner
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                
                                <div className="px-4 pt-2 flex-1 flex flex-col justify-between space-y-3">
                                    <h3 className="font-semibold text-base line-clamp-1" title={banner.title || "Untitled Banner"}>
                                        {banner.title || "Untitled Banner"}
                                    </h3>
                                    
                                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 pb-4 ">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="size-3.5" />
                                            <span>{date}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="size-3.5" />
                                            <span>{time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

export default function BannerManagementPage() {
    const [activeBanners, setActiveBanners] = useState<BannerApiItem[]>([])
    const [inactiveBanners, setInactiveBanners] = useState<BannerApiItem[]>([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

    const [title, setTitle] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [selectedBanner, setSelectedBanner] = useState<BannerApiItem | null>(null)
    const [deleteBannerId, setDeleteBannerId] = useState<string | null>(null)
    const maxActiveReached = activeBanners.length >= 4

    const fetchBanners = useCallback(async () => {
        try {
            setLoading(true)
            setMessage(null)
            const [activeRes, inactiveRes] = await Promise.all([
                api.get<{ data: BannerApiItem[] }>("/staff/banners", { params: { status: "ACTIVE" } }),
                api.get<{ data: BannerApiItem[] }>("/staff/banners", { params: { status: "INACTIVE" } }),
            ])
            setActiveBanners(activeRes.data.data ?? [])
            setInactiveBanners(inactiveRes.data.data ?? [])
        } catch (err) {
            console.error("Fetch banners error:", err)
            setMessage({ text: "Failed to load banners", type: 'error' })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void fetchBanners()
    }, [fetchBanners])

    const canSubmit = useMemo(() => Boolean(title.trim() && file), [title, file])
    const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

    useEffect(() => {
        return () => {
            if (filePreview) URL.revokeObjectURL(filePreview)
        }
    }, [filePreview])

    const handleCreateBanner = async () => {
        if (!file || !title.trim()) return
        try {
            setIsSubmitting(true)
            setMessage(null)

            const formData = new FormData()
            formData.append("file", file)
            formData.append("purpose", "PROPERTY_IMAGE")

            const uploadRes = await api.post<{
                success: boolean
                data: { fileUrl: string; key: string }
            }>("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })

            await api.post("/staff/banners", {
                title: title.trim(),
                image: uploadRes.data.data.fileUrl,
                imageKey: uploadRes.data.data.key,
            })

            setTitle("")
            setFile(null)
            setAddDialogOpen(false)
            setMessage({ text: "Banner created successfully", type: 'success' })
            await fetchBanners()
        } catch (err) {
            console.error("Create banner error:", err)
            const msg =
                err instanceof AxiosError && (err.response?.data as { message?: string })?.message
                    ? String((err.response?.data as { message?: string }).message)
                    : "Failed to create banner"
            setMessage({ text: msg, type: 'error' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggleStatus = async (id: string, nextStatus: "ACTIVE" | "INACTIVE") => {
        try {
            setMessage(null)
            const response = await api.put<{ message?: string }>(`/staff/banners/${id}/status`, { status: nextStatus })
            setMessage({ text: response.data.message ?? `Banner marked as ${nextStatus.toLowerCase()}`, type: 'success' })
            await fetchBanners()
        } catch (err) {
            console.error("Update banner status error:", err)
            const msg =
                err instanceof AxiosError && (err.response?.data as { message?: string })?.message
                    ? String((err.response?.data as { message?: string }).message)
                    : "Failed to update banner status"
            setMessage({ text: msg, type: 'error' })
        }
    }

    const handleDeleteBanner = async (id: string) => {
        try {
            setMessage(null)
            const response = await api.delete<{ message?: string }>(`/staff/banners/${id}`)
            setMessage({ text: response.data.message ?? "Banner deleted successfully", type: 'success' })
            setDeleteBannerId(null)
            await fetchBanners()
        } catch (err) {
            console.error("Delete banner error:", err)
            const msg =
                err instanceof AxiosError && (err.response?.data as { message?: string })?.message
                    ? String((err.response?.data as { message?: string }).message)
                    : "Failed to delete banner"
            setMessage({ text: msg, type: 'error' })
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-6 sm:p-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-medium text-xl pr-2 ">Banner Management</h1>
                </div>
                <Button
                    onClick={() => setAddDialogOpen(true)}
                    className="gap-2"
                    disabled={maxActiveReached}
                    title={maxActiveReached ? "Maximum 4 active banners allowed" : undefined}
                >
                    <Plus className="size-4" />
                    Add New Banner
                </Button>
            </div>
            {maxActiveReached && (
                <p className="text-sm text-black bg-amber-100 p-4 rounded-lg font-medium flex items-center gap-2"> <AlertCircleIcon className="size-4" /> 4/4 Active Banners Reached. Mark one as Inactive to add a new banner.
                </p>
            )}

            {/* Alert Message */}
            {message && (
                <div className={`p-4 rounded-lg border text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                    {message.text}
                </div>
            )}

            {/* Main Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-muted-foreground">Loading banners...</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-12">
                    <BannerList
                        title="Active Banners"
                        banners={activeBanners}
                        onToggleStatus={handleToggleStatus}
                        onDelete={setDeleteBannerId}
                        onPreview={setSelectedBanner}
                    />
                    <BannerList
                        title="Inactive Banners"
                        banners={inactiveBanners}
                        isInactive={true}
                        onToggleStatus={handleToggleStatus}
                        onDelete={setDeleteBannerId}
                        onPreview={setSelectedBanner}
                    />
                </div>
            )}

            {/* Add Banner Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Banner</DialogTitle>
                        <DialogDescription>
                            Upload a high-quality image and provide a title for your new banner.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Banner Title</label>
                            <Input
                                placeholder="e.g. Summer Sale Promo"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Image File</label>
                            <Input
                                type="file"
                                accept="image/*"
                                className="cursor-pointer file:cursor-pointer"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                            />
                        </div>
                        {filePreview && (
                            <div className="rounded-lg overflow-hidden border  aspect-video bg-muted relative">
                                <Image
                                    src={filePreview}
                                    alt="Selected preview"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setAddDialogOpen(false)
                                setTitle("")
                                setFile(null)
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreateBanner} disabled={!canSubmit || isSubmitting || maxActiveReached}>
                            {isSubmitting ? "Uploading..." : "Create Banner"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={Boolean(selectedBanner)} onOpenChange={(open) => !open && setSelectedBanner(null)}>
                <DialogContent className="max-w-4xl p-1 gap-0 overflow-hidden bg-background/95 backdrop-blur-sm border-none ">
                    {selectedBanner && (
                        <div className="relative w-full aspect-[21/9]">
                            <Image
                                src={selectedBanner.image}
                                alt={selectedBanner.title ?? "Banner preview"}
                                fill
                                className="object-contain"
                            />
                        </div>
                    )}
                    <div className="p-4 bg-background border-t flex justify-between items-center">
                        <h3 className="font-semibold">{selectedBanner?.title || "Banner Preview"}</h3>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedBanner(null)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog (no image preview) */}
            <Dialog open={Boolean(deleteBannerId)} onOpenChange={(open) => !open && setDeleteBannerId(null)}>
                <DialogContent className="sm:max-w-md [&>button]:hidden">
                    <DialogDescription>
                        Are you sure you want to delete this banner?
                    </DialogDescription>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteBannerId(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteBannerId && handleDeleteBanner(deleteBannerId)}
                        >
                            Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}