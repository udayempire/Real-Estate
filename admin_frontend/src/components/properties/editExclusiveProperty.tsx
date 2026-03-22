"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Loader2, X } from "lucide-react";

type ExclusiveStatus = "ACTIVE" | "SOLD_OUT" | "UNLISTED";
type CategoryValue = "" | "RESIDENTIAL" | "COMMERCIAL" | "AGRICULTURAL";

type MetadataCategoryRow = {
    category: string;
    types: string[];
};

type ExistingProperty = {
    fixedRewardGems?: number | null;
    notes?: string | null;
    status?: string | null;
    title?: string | null;
    description?: string | null;
    listingPrice?: number | null;
    priceMin?: number | null;
    priceMax?: number | null;
    state?: string | null;
    city?: string | null;
    locality?: string | null;
    subLocality?: string | null;
    flatNo?: string | null;
    area?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    carpetArea?: number | null;
    carpetAreaUnit?: string | null;
    plotLandArea?: number | null;
    plotLandAreaUnit?: string | null;
    propertyFloor?: string | null;
    category?: string | null;
    propertyType?: string | null;
    furnishingStatus?: string | null;
    availabilityStatus?: string | null;
    ageOfProperty?: string | null;
    propertyFacing?: string | null;
    numberOfRooms?: number | null;
    numberOfBathrooms?: number | null;
    numberOfBalcony?: number | null;
    numberOfFloors?: number | null;
    coveredParking?: number | null;
    uncoveredParking?: number | null;
    amenities?: string[];
    locationAdvantages?: string[];
    allInclusivePrice?: boolean;
    negotiablePrice?: boolean;
    govtChargesTaxIncluded?: boolean;
    isExtraRewardOn?: boolean;
    media?: Array<{ url: string; key: string; mediaType: "IMAGE" | "VIDEO"; order?: number | null }>;
};

type FormState = {
    fixedRewardGems: string;
    notes: string;
    status: ExclusiveStatus;
    title: string;
    description: string;
    listingPrice: string;
    priceMin: string;
    priceMax: string;
    state: string;
    city: string;
    locality: string;
    subLocality: string;
    flatNo: string;
    area: string;
    address: string;
    latitude: string;
    longitude: string;
    carpetArea: string;
    carpetAreaUnit: "" | "NONE" | "SQFT" | "SQM" | "ACRES";
    plotLandArea: string;
    plotLandAreaUnit: "" | "NONE" | "SQFT" | "SQM" | "ACRES";
    category: CategoryValue;
    propertyType: string;
    furnishingStatus: "" | "FullyFurnished" | "SemiFurnished" | "Unfurnished" | "FencedWired" | "FertileLand" | "OpenLand" | "Cultivated";
    availabilityStatus: "" | "ReadyToMove" | "UnderConstruction";
    ageOfProperty: "" | "ZeroToOne" | "OneToThree" | "ThreeToSix" | "SixToTen" | "TenPlus";
    propertyFacing: "" | "East" | "West" | "North" | "South" | "NorthEast" | "NorthWest" | "SouthEast" | "SouthWest";
    numberOfRooms: string;
    numberOfBathrooms: string;
    numberOfBalcony: string;
    numberOfFloors: string;
    propertyFloor: string;
    coveredParking: string;
    uncoveredParking: string;
    amenities: string;
    locationAdvantages: string;
    allInclusivePrice: boolean;
    negotiablePrice: boolean;
    govtChargesTaxIncluded: boolean;
    isExtraRewardOn: boolean;
};

const initialState: FormState = {
    fixedRewardGems: "",
    notes: "",
    status: "ACTIVE",
    title: "",
    description: "",
    listingPrice: "",
    priceMin: "",
    priceMax: "",
    state: "",
    city: "",
    locality: "",
    subLocality: "",
    flatNo: "",
    area: "",
    address: "",
    latitude: "",
    longitude: "",
    carpetArea: "",
    carpetAreaUnit: "",
    plotLandArea: "",
    plotLandAreaUnit: "",
    category: "",
    propertyType: "",
    furnishingStatus: "",
    availabilityStatus: "",
    ageOfProperty: "",
    propertyFacing: "",
    numberOfRooms: "",
    numberOfBathrooms: "",
    numberOfBalcony: "",
    numberOfFloors: "",
    propertyFloor: "",
    coveredParking: "",
    uncoveredParking: "",
    amenities: "",
    locationAdvantages: "",
    allInclusivePrice: false,
    negotiablePrice: false,
    govtChargesTaxIncluded: false,
    isExtraRewardOn: false,
};

const toOptionalNumber = (value: string) => {
    if (!value.trim()) return undefined;
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
};

const toOptionalString = (value: string) => {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
};

const toOptionalArray = (value: string) => {
    const list = value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    return list.length ? list : undefined;
};

type MediaEntry = {
    url: string;
    key: string;
    mediaType: "IMAGE" | "VIDEO";
    order: number;
};

// You can change upload limits here.
const MAX_IMAGE_COUNT = 6;
const MAX_VIDEO_COUNT = 1;
const MAX_IMAGE_SIZE_MB = 2;
const MAX_VIDEO_SIZE_MB = 4;

export function EditExclusiveProperty() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const propertyId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const [form, setForm] = useState<FormState>(initialState);
    const [existing, setExisting] = useState<ExistingProperty | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingExisting, setIsLoadingExisting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editConfirmOpen, setEditConfirmOpen] = useState(false);

    const [switchTouched, setSwitchTouched] = useState({
        allInclusivePrice: false,
        negotiablePrice: false,
        govtChargesTaxIncluded: false,
        isExtraRewardOn: false,
    });
    const [typesByCategory, setTypesByCategory] = useState<Record<Exclude<CategoryValue, "">, string[]>>({
        RESIDENTIAL: [],
        COMMERCIAL: [],
        AGRICULTURAL: [],
    });
    const [isLoadingPropertyTypes, setIsLoadingPropertyTypes] = useState(false);
    const [mediaItems, setMediaItems] = useState<MediaEntry[]>([]);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [previewMedia, setPreviewMedia] = useState<MediaEntry | null>(null);
    const [deleteMediaIndex, setDeleteMediaIndex] = useState<number | null>(null);

    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        if (!existing) return;
        setForm((prev) => ({
            ...prev,
            fixedRewardGems: existing.fixedRewardGems != null ? String(existing.fixedRewardGems) : "",
            notes: existing.notes ?? "",
            status: (existing.status as ExclusiveStatus) ?? "ACTIVE",
            title: existing.title ?? "",
            description: existing.description ?? "",
            listingPrice: existing.listingPrice != null ? String(existing.listingPrice) : "",
            priceMin: existing.priceMin != null ? String(existing.priceMin) : "",
            priceMax: existing.priceMax != null ? String(existing.priceMax) : "",
            state: existing.state ?? "",
            city: existing.city ?? "",
            locality: existing.locality ?? "",
            subLocality: existing.subLocality ?? "",
            flatNo: existing.flatNo ?? "",
            area: existing.area ?? "",
            address: existing.address ?? "",
            latitude: existing.latitude != null ? String(existing.latitude) : "",
            longitude: existing.longitude != null ? String(existing.longitude) : "",
            carpetArea: String(existing.carpetArea ?? 0),
            carpetAreaUnit: (existing.carpetAreaUnit as FormState["carpetAreaUnit"]) ?? "",
            plotLandArea: String(existing.plotLandArea ?? 0),
            plotLandAreaUnit: (existing.plotLandAreaUnit as FormState["plotLandAreaUnit"]) ?? "",
            category: (existing.category as FormState["category"]) ?? "",
            propertyType: existing.propertyType ?? "",
            furnishingStatus: (existing.furnishingStatus as FormState["furnishingStatus"]) ?? "",
            availabilityStatus: (existing.availabilityStatus as FormState["availabilityStatus"]) ?? "",
            ageOfProperty: (existing.ageOfProperty as FormState["ageOfProperty"]) ?? "",
            propertyFacing: (existing.propertyFacing as FormState["propertyFacing"]) ?? "",
            numberOfRooms: existing.numberOfRooms != null ? String(existing.numberOfRooms) : "",
            numberOfBathrooms: existing.numberOfBathrooms != null ? String(existing.numberOfBathrooms) : "",
            numberOfBalcony: existing.numberOfBalcony != null ? String(existing.numberOfBalcony) : "",
            numberOfFloors: existing.numberOfFloors != null ? String(existing.numberOfFloors) : "",
            propertyFloor: existing.propertyFloor ?? "",
            coveredParking: existing.coveredParking != null ? String(existing.coveredParking) : "",
            uncoveredParking: existing.uncoveredParking != null ? String(existing.uncoveredParking) : "",
            amenities: existing.amenities?.length ? existing.amenities.join(", ") : "",
            locationAdvantages: existing.locationAdvantages?.length ? existing.locationAdvantages.join(", ") : "",
            allInclusivePrice: existing.allInclusivePrice ?? false,
            negotiablePrice: existing.negotiablePrice ?? false,
            govtChargesTaxIncluded: existing.govtChargesTaxIncluded ?? false,
            isExtraRewardOn: existing.isExtraRewardOn ?? false,
        }));
        setSwitchTouched({
            allInclusivePrice: existing.allInclusivePrice != null,
            negotiablePrice: existing.negotiablePrice != null,
            govtChargesTaxIncluded: existing.govtChargesTaxIncluded != null,
            isExtraRewardOn: existing.isExtraRewardOn != null,
        });
        setMediaItems(
            (existing.media ?? []).map((m, index) => ({
                url: m.url,
                key: m.key,
                mediaType: m.mediaType,
                order: m.order ?? index,
            }))
        );
    }, [existing]);

    useEffect(() => {
        let mounted = true;
        const loadExisting = async () => {
            try {
                setIsLoadingExisting(true);
                if (!propertyId) return;
                const response = await api.get<{ success: boolean; data: ExistingProperty }>(`/staff/properties/exclusive/${propertyId}`);
                if (!mounted) return;
                setExisting(response.data.data);
            } catch {
                if (!mounted) return;
                setExisting(null);
            } finally {
                if (mounted) setIsLoadingExisting(false);
            }
        };
        loadExisting();
        return () => {
            mounted = false;
        };
    }, [propertyId]);

    useEffect(() => {
        let mounted = true;
        const loadPropertyTypes = async () => {
            try {
                setIsLoadingPropertyTypes(true);
                const response = await api.get<{ success: boolean; data: MetadataCategoryRow[] }>("/metadata/property-categories");
                if (!mounted) return;
                const next: Record<Exclude<CategoryValue, "">, string[]> = {
                    RESIDENTIAL: [],
                    COMMERCIAL: [],
                    AGRICULTURAL: [],
                };
                for (const row of response.data.data ?? []) {
                    if (!row?.category || !Array.isArray(row.types)) continue;
                    if (!["RESIDENTIAL", "COMMERCIAL", "AGRICULTURAL"].includes(row.category)) continue;
                    next[row.category as Exclude<CategoryValue, "">] = row.types.filter((t) => typeof t === "string" && t.trim().length > 0);
                }
                setTypesByCategory(next);
            } catch (err) {
                console.error("Failed to load property type metadata:", err);
            } finally {
                if (mounted) setIsLoadingPropertyTypes(false);
            }
        };
        void loadPropertyTypes();
        return () => {
            mounted = false;
        };
    }, []);

    const propertyTypeOptions = form.category ? typesByCategory[form.category] ?? [] : [];
    const hasCustomPropertyType = Boolean(form.propertyType) && !propertyTypeOptions.includes(form.propertyType);

    const uploadSingleMedia = async (file: File, mediaType: "IMAGE" | "VIDEO") => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("purpose", mediaType === "IMAGE" ? "PROPERTY_IMAGE" : "PROPERTY_VIDEO");
        const uploadRes = await api.post<{ success: boolean; data: { fileUrl: string; key: string } }>("/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return uploadRes.data.data;
    };

    const handleMediaFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const selected = Array.from(files);
        const currentImageCount = mediaItems.filter((m) => m.mediaType === "IMAGE").length;
        const currentVideoCount = mediaItems.filter((m) => m.mediaType === "VIDEO").length;

        const nextImages = selected.filter((f) => f.type.startsWith("image/"));
        const nextVideos = selected.filter((f) => f.type.startsWith("video/"));

        if (currentImageCount + nextImages.length > MAX_IMAGE_COUNT) {
            setError(`You can upload maximum ${MAX_IMAGE_COUNT} photos.`);
            return;
        }
        if (currentVideoCount + nextVideos.length > MAX_VIDEO_COUNT) {
            setError(`You can upload maximum ${MAX_VIDEO_COUNT} video.`);
            return;
        }
        const imageLimitBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
        const videoLimitBytes = MAX_VIDEO_SIZE_MB * 1024 * 1024;
        for (const file of nextImages) {
            if (file.size > imageLimitBytes) {
                setError(`Each photo must be <= ${MAX_IMAGE_SIZE_MB}MB.`);
                return;
            }
        }
        for (const file of nextVideos) {
            if (file.size > videoLimitBytes) {
                setError(`Video must be <= ${MAX_VIDEO_SIZE_MB}MB.`);
                return;
            }
        }

        try {
            setError(null);
            setIsUploadingMedia(true);
            const uploaded: MediaEntry[] = [];
            for (const file of selected) {
                const mediaType: "IMAGE" | "VIDEO" | null = file.type.startsWith("image/")
                    ? "IMAGE"
                    : file.type.startsWith("video/")
                        ? "VIDEO"
                        : null;
                if (!mediaType) continue;
                const data = await uploadSingleMedia(file, mediaType);
                uploaded.push({
                    url: data.fileUrl,
                    key: data.key,
                    mediaType,
                    order: 0,
                });
            }
            setMediaItems((prev) => {
                const merged = [...prev, ...uploaded];
                return merged.map((m, index) => ({ ...m, order: index }));
            });
        } catch (err) {
            console.error("Media upload failed:", err);
            setError("Failed to upload media files");
        } finally {
            setIsUploadingMedia(false);
        }
    };

    const handleDeleteMedia = (index: number) => {
        setDeleteMediaIndex(index);
    };

    const handleDeleteMediaConfirm = () => {
        if (deleteMediaIndex == null) return;
        setMediaItems((prev) => prev.filter((_, i) => i !== deleteMediaIndex).map((m, i) => ({ ...m, order: i })));
        setDeleteMediaIndex(null);
    };

    const handleSubmit = async () => {
        setError(null);
        setSuccess(null);

        if (!propertyId) {
            setError("Invalid property id");
            return;
        }

        if (!form.fixedRewardGems.trim() || Number(form.fixedRewardGems) < 0) {
            setError("fixedRewardGems is required and must be non-negative");
            return;
        }

        const payload = {
            fixedRewardGems: Number(form.fixedRewardGems),
            notes: toOptionalString(form.notes),
            status: form.status,
            title: toOptionalString(form.title),
            description: toOptionalString(form.description),
            listingPrice: toOptionalNumber(form.listingPrice),
            priceMin: toOptionalNumber(form.priceMin),
            priceMax: toOptionalNumber(form.priceMax),
            state: toOptionalString(form.state),
            city: toOptionalString(form.city),
            locality: toOptionalString(form.locality),
            subLocality: toOptionalString(form.subLocality),
            flatNo: toOptionalString(form.flatNo),
            area: toOptionalString(form.area),
            address: toOptionalString(form.address),
            latitude: toOptionalNumber(form.latitude),
            longitude: toOptionalNumber(form.longitude),
            carpetArea: (() => {
                const value = toOptionalNumber(form.carpetArea);
                return value === 0 ? null : value;
            })(),
            carpetAreaUnit: form.carpetAreaUnit === "NONE" ? null : form.carpetAreaUnit || undefined,
            plotLandArea: (() => {
                const value = toOptionalNumber(form.plotLandArea);
                return value === 0 ? null : value;
            })(),
            plotLandAreaUnit: form.plotLandAreaUnit === "NONE" ? null : form.plotLandAreaUnit || undefined,
            category: form.category || undefined,
            propertyType: form.propertyType || undefined,
            furnishingStatus: form.furnishingStatus || undefined,
            availabilityStatus: form.availabilityStatus || undefined,
            ageOfProperty: form.ageOfProperty || undefined,
            propertyFacing: form.propertyFacing || undefined,
            numberOfRooms: toOptionalNumber(form.numberOfRooms),
            numberOfBathrooms: toOptionalNumber(form.numberOfBathrooms),
            numberOfBalcony: toOptionalNumber(form.numberOfBalcony),
            numberOfFloors: toOptionalNumber(form.numberOfFloors),
            propertyFloor: toOptionalString(form.propertyFloor),
            coveredParking: toOptionalNumber(form.coveredParking),
            uncoveredParking: toOptionalNumber(form.uncoveredParking),
            amenities: toOptionalArray(form.amenities),
            locationAdvantages: toOptionalArray(form.locationAdvantages),
            allInclusivePrice: switchTouched.allInclusivePrice ? form.allInclusivePrice : undefined,
            negotiablePrice: switchTouched.negotiablePrice ? form.negotiablePrice : undefined,
            govtChargesTaxIncluded: switchTouched.govtChargesTaxIncluded ? form.govtChargesTaxIncluded : undefined,
            isExtraRewardOn: switchTouched.isExtraRewardOn ? form.isExtraRewardOn : undefined,
            media: mediaItems.map((m, index) => ({
                url: m.url,
                key: m.key,
                mediaType: m.mediaType,
                order: index,
            })),
        };

        try {
            setIsSubmitting(true);
            const response = await api.put<{ message?: string }>(`/staff/properties/exclusive/${propertyId}`, payload);
            setSuccess(response.data.message ?? "Exclusive property updated successfully");
            router.push("/property/exclusive-listings");
        } catch (err: unknown) {
            const msg =
                typeof err === "object" &&
                    err !== null &&
                    "response" in err &&
                    typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
                    ? (err as { response?: { data?: { message?: string } } }).response!.data!.message!
                    : "Failed to update exclusive property";
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <Card className="max-w-6xl">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold">Update Exclusive Property</CardTitle>
                    <CardDescription>
                        Edit the property details for the exclusive listing.
                    </CardDescription>
                    {isLoadingExisting && <p className="text-xs text-gray-500">Loading current property values...</p>}
                    {!propertyId && <p className="text-xs text-red-500">Invalid property id in route.</p>}
                    <p className="text-xs text-gray-500">
                        Media limits: max {MAX_IMAGE_COUNT} photos ({MAX_IMAGE_SIZE_MB}MB each) and {MAX_VIDEO_COUNT} video ({MAX_VIDEO_SIZE_MB}MB).
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="space-y-3 border rounded-md p-4">
                        <FieldLabel>Property Media</FieldLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {mediaItems.map((item, index) => (
                                <div key={`${item.key}-${index}`} className="relative border rounded-md p-2">
                                    <button type="button" className="w-full" onClick={() => setPreviewMedia(item)}>
                                        {item.mediaType === "VIDEO" ? (
                                            <video src={item.url} className="h-28 w-full object-cover rounded" />
                                        ) : (
                                            <Image src={item.url} alt={`media-${index}`} width={320} height={112} className="h-28 w-full object-cover rounded" unoptimized />
                                        )}
                                    </button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        className="mt-2 w-full"
                                        onClick={() => handleDeleteMedia(index)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={(e) => {
                                void handleMediaFiles(e.target.files);
                                e.currentTarget.value = "";
                            }}
                            className="h-10 border-2 bg-white"
                            disabled={isUploadingMedia}
                        />
                        {isUploadingMedia && <p className="text-xs text-gray-500">Uploading media...</p>}
                    </div>

                    <Dialog open={Boolean(previewMedia)} onOpenChange={(open) => !open && setPreviewMedia(null)}>
                        <DialogContent className="max-w-4xl">
                            <DialogHeader>
                                <DialogTitle>Media Preview</DialogTitle>
                            </DialogHeader>
                            {previewMedia?.mediaType === "VIDEO" ? (
                                <video src={previewMedia.url} controls autoPlay className="w-full max-h-[75vh] rounded object-contain" />
                            ) : previewMedia ? (
                                <Image
                                    src={previewMedia.url}
                                    alt="Selected property media"
                                    width={1440}
                                    height={900}
                                    className="w-full max-h-[75vh] rounded object-contain"
                                    unoptimized
                                />
                            ) : null}
                        </DialogContent>
                    </Dialog>

                    <Dialog open={deleteMediaIndex !== null} onOpenChange={(open) => !open && setDeleteMediaIndex(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Media</DialogTitle>
                            </DialogHeader>
                            <p className="text-sm text-muted-foreground">Are you sure you want to delete this media file?</p>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setDeleteMediaIndex(null)}>
                                    Cancel
                                </Button>
                                <Button type="button" variant="destructive" onClick={handleDeleteMediaConfirm}>
                                    Delete
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Fixed Reward Gems</FieldLabel>
                            <Input
                                type="number"
                                min={0}
                                value={form.fixedRewardGems}
                                onChange={(e) => setField("fixedRewardGems", e.target.value)}
                                className="h-10 border-2 bg-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Status</FieldLabel>
                            <Select value={form.status} onValueChange={(v) => setField("status", v as ExclusiveStatus)}>
                                <SelectTrigger className="h-10 border-2 bg-white w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="font-medium">
                                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                                    <SelectItem value="SOLD_OUT">SOLD OUT</SelectItem>
                                    <SelectItem value="UNLISTED">UNLISTED</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Title Override</FieldLabel>
                            <Input value={form.title} onChange={(e) => setField("title", e.target.value)} className="h-10 border-2 bg-white" placeholder="Property title" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Description Override</FieldLabel>
                            <Input value={form.description} onChange={(e) => setField("description", e.target.value)} className="h-10 border-2 bg-white" placeholder="Property description" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Listing Price</FieldLabel>
                            <Input type="number" value={form.listingPrice} onChange={(e) => setField("listingPrice", e.target.value)} className="h-10 border-2 bg-white" placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Price Min</FieldLabel>
                            <Input type="number" value={form.priceMin} onChange={(e) => setField("priceMin", e.target.value)} className="h-10 border-2 bg-white" placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Price Max</FieldLabel>
                            <Input type="number" value={form.priceMax} onChange={(e) => setField("priceMax", e.target.value)} className="h-10 border-2 bg-white" placeholder="0" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Category</FieldLabel>
                            <Select
                                value={form.category}
                                onValueChange={(v) => {
                                    setField("category", v as FormState["category"]);
                                    setField("propertyType", "");
                                }}
                            >
                                <SelectTrigger className="h-10 border-2 bg-white w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RESIDENTIAL">RESIDENTIAL</SelectItem>
                                    <SelectItem value="COMMERCIAL">COMMERCIAL</SelectItem>
                                    <SelectItem value="AGRICULTURAL">AGRICULTURAL</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Property Type</FieldLabel>
                            <select
                                value={form.propertyType}
                                onChange={(e) => setField("propertyType", e.target.value)}
                                disabled={!form.category || isLoadingPropertyTypes}
                                className="h-10 w-full rounded-md border-2 border-input bg-white px-3 text-sm disabled:opacity-70"
                            >
                                {!form.category && <option value="">Select category first</option>}
                                {isLoadingPropertyTypes && <option value="">Loading property types...</option>}
                                {!isLoadingPropertyTypes && form.category && <option value="">Select property type</option>}
                                {hasCustomPropertyType && <option value={form.propertyType}>{form.propertyType} (current)</option>}
                                {!isLoadingPropertyTypes && form.category && propertyTypeOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Furnishing Status</FieldLabel>
                            <Select
                                value={form.furnishingStatus}
                                onValueChange={(v) => setField("furnishingStatus", v as FormState["furnishingStatus"])}
                            >
                                <SelectTrigger className="h-10 border-2 bg-white w-full">
                                    <SelectValue placeholder="Select furnishing status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FullyFurnished">Fully Furnished</SelectItem>
                                    <SelectItem value="SemiFurnished">Semi Furnished</SelectItem>
                                    <SelectItem value="Unfurnished">Unfurnished</SelectItem>
                                    <SelectItem value="FencedWired">Fenced Wired</SelectItem>
                                    <SelectItem value="FertileLand">Fertile Land</SelectItem>
                                    <SelectItem value="OpenLand">Open Land</SelectItem>
                                    <SelectItem value="Cultivated">Cultivated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>State</FieldLabel>
                            <Input value={form.state} onChange={(e) => setField("state", e.target.value)} className="h-10 border-2 bg-white" placeholder="State" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>City</FieldLabel>
                            <Input value={form.city} onChange={(e) => setField("city", e.target.value)} className="h-10 border-2 bg-white" placeholder="City" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Locality</FieldLabel>
                            <Input value={form.locality} onChange={(e) => setField("locality", e.target.value)} className="h-10 border-2 bg-white" placeholder="Locality" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Sub Locality</FieldLabel>
                            <Input value={form.subLocality} onChange={(e) => setField("subLocality", e.target.value)} className="h-10 border-2 bg-white" placeholder="Sub locality" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Flat No</FieldLabel>
                            <Input value={form.flatNo} onChange={(e) => setField("flatNo", e.target.value)} className="h-10 border-2 bg-white" placeholder="Flat / House no" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Area (text)</FieldLabel>
                            <Input value={form.area} onChange={(e) => setField("area", e.target.value)} className="h-10 border-2 bg-white" placeholder="Area" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Address</FieldLabel>
                            <Input value={form.address} onChange={(e) => setField("address", e.target.value)} className="h-10 border-2 bg-white" placeholder="Address" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Latitude</FieldLabel>
                            <Input type="number" step="any" value={form.latitude} onChange={(e) => setField("latitude", e.target.value)} className="h-10 border-2 bg-white" placeholder="0.0" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Longitude</FieldLabel>
                            <Input type="number" step="any" value={form.longitude} onChange={(e) => setField("longitude", e.target.value)} className="h-10 border-2 bg-white" placeholder="0.0" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Carpet Area</FieldLabel>
                            <Input type="number" step="any" value={form.carpetArea} onChange={(e) => setField("carpetArea", e.target.value)} className="h-10 border-2 bg-white" placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Carpet Area Unit</FieldLabel>
                            <Select value={form.carpetAreaUnit} onValueChange={(v) => setField("carpetAreaUnit", v as FormState["carpetAreaUnit"])}>
                                <SelectTrigger className="h-10 border-2 bg-white w-full"><SelectValue placeholder="Select unit" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NONE">None</SelectItem>
                                    <SelectItem value="SQFT">SQFT</SelectItem>
                                    <SelectItem value="SQM">SQM</SelectItem>
                                    <SelectItem value="ACRES">ACRES</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Plot Land Area</FieldLabel>
                            <Input type="number" step="any" value={form.plotLandArea} onChange={(e) => setField("plotLandArea", e.target.value)} className="h-10 border-2 bg-white" placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Plot Land Area Unit</FieldLabel>
                            <Select value={form.plotLandAreaUnit} onValueChange={(v) => setField("plotLandAreaUnit", v as FormState["plotLandAreaUnit"])}>
                                <SelectTrigger className="h-10 border-2 bg-white w-full"><SelectValue placeholder="Select unit" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NONE">None</SelectItem>
                                    <SelectItem value="SQFT">SQFT</SelectItem>
                                    <SelectItem value="SQM">SQM</SelectItem>
                                    <SelectItem value="ACRES">ACRES</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Age Of Property</FieldLabel>
                            <Select value={form.ageOfProperty} onValueChange={(v) => setField("ageOfProperty", v as FormState["ageOfProperty"])}>
                                <SelectTrigger className="h-10 border-2 bg-white w-full"><SelectValue placeholder="Select age" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ZeroToOne">Zero To One</SelectItem>
                                    <SelectItem value="OneToThree">One To Three</SelectItem>
                                    <SelectItem value="ThreeToSix">Three To Six</SelectItem>
                                    <SelectItem value="SixToTen">Six To Ten</SelectItem>
                                    <SelectItem value="TenPlus">Ten Plus</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Property Facing</FieldLabel>
                            <Select value={form.propertyFacing} onValueChange={(v) => setField("propertyFacing", v as FormState["propertyFacing"])}>
                                <SelectTrigger className="h-10 border-2 bg-white w-full"><SelectValue placeholder="Select facing" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="East">East</SelectItem>
                                    <SelectItem value="West">West</SelectItem>
                                    <SelectItem value="North">North</SelectItem>
                                    <SelectItem value="South">South</SelectItem>
                                    <SelectItem value="NorthEast">North East</SelectItem>
                                    <SelectItem value="NorthWest">North West</SelectItem>
                                    <SelectItem value="SouthEast">South East</SelectItem>
                                    <SelectItem value="SouthWest">South West</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Property Floor</FieldLabel>
                            <Input value={form.propertyFloor} onChange={(e) => setField("propertyFloor", e.target.value)} className="h-10 border-2 bg-white" placeholder="e.g. 3" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Rooms</FieldLabel>
                            <Input type="number" min={0} value={form.numberOfRooms} onChange={(e) => setField("numberOfRooms", e.target.value)} className="h-10 border-2 bg-white" placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Bathrooms</FieldLabel>
                            <Input type="number" min={0} value={form.numberOfBathrooms} onChange={(e) => setField("numberOfBathrooms", e.target.value)} className="h-10 border-2 bg-white" placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Balcony</FieldLabel>
                            <Input type="number" min={0} value={form.numberOfBalcony} onChange={(e) => setField("numberOfBalcony", e.target.value)} className="h-10 border-2 bg-white" placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Floors</FieldLabel>
                            <Input type="number" min={0} value={form.numberOfFloors} onChange={(e) => setField("numberOfFloors", e.target.value)} className="h-10 border-2 bg-white" placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Covered Parking</FieldLabel>
                            <Input type="number" min={0} value={form.coveredParking} onChange={(e) => setField("coveredParking", e.target.value)} className="h-10 border-2 bg-white" placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Uncovered Parking</FieldLabel>
                            <Input type="number" min={0} value={form.uncoveredParking} onChange={(e) => setField("uncoveredParking", e.target.value)} className="h-10 border-2 bg-white" placeholder="0" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <FieldLabel className="mb-0">All Inclusive Price</FieldLabel>
                            <Switch
                                checked={form.allInclusivePrice}
                                onCheckedChange={(v) => {
                                    setField("allInclusivePrice", v);
                                    setSwitchTouched((prev) => ({ ...prev, allInclusivePrice: true }));
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <FieldLabel className="mb-0">Negotiable Price</FieldLabel>
                            <Switch
                                checked={form.negotiablePrice}
                                onCheckedChange={(v) => {
                                    setField("negotiablePrice", v);
                                    setSwitchTouched((prev) => ({ ...prev, negotiablePrice: true }));
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <FieldLabel className="mb-0">Govt Charges Included</FieldLabel>
                            <Switch
                                checked={form.govtChargesTaxIncluded}
                                onCheckedChange={(v) => {
                                    setField("govtChargesTaxIncluded", v);
                                    setSwitchTouched((prev) => ({ ...prev, govtChargesTaxIncluded: true }));
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <FieldLabel className="mb-0">Enable Extra Rewarded</FieldLabel>
                            <Switch
                                checked={form.isExtraRewardOn}
                                onCheckedChange={(v) => {
                                    setField("isExtraRewardOn", v);
                                    setSwitchTouched((prev) => ({ ...prev, isExtraRewardOn: true }));
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Amenities (comma separated)</FieldLabel>
                            <Input
                                value={form.amenities}
                                onChange={(e) => setField("amenities", e.target.value)}
                                className="h-10 border-2 bg-white"
                                placeholder="Gym, Lift, Security"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Location Advantages (comma separated)</FieldLabel>
                            <Input
                                value={form.locationAdvantages}
                                onChange={(e) => setField("locationAdvantages", e.target.value)}
                                className="h-10 border-2 bg-white"
                                placeholder="Near metro, Near school"
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-600">{success}</p>}
                </CardContent>

                <CardFooter className="justify-end gap-3">
                    <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="gap-2">
                        <X className="size-4" />
                        Cancel
                    </Button>
                    <Button onClick={() => setEditConfirmOpen(true)} disabled={isSubmitting} className="gap-2 bg-blue-600 hover:bg-blue-700">
                        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                        {isSubmitting ? "Editing..." : "Edit Property"}
                    </Button>
                </CardFooter>
            </Card>
            <Dialog open={editConfirmOpen} onOpenChange={setEditConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Edit Property</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to edit this property ?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditConfirmOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                                setEditConfirmOpen(false);
                                void handleSubmit();
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                            {isSubmitting ? "Editing..." : "Yes, Update It"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

