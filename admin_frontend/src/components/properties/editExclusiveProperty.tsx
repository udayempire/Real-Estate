"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, Loader2, X } from "lucide-react";

type ExclusiveStatus = "ACTIVE" | "SOLD_OUT" | "ARCHIVED";

type ExistingProperty = {
    title?: string | null;
    description?: string | null;
    listingPrice?: number | null;
    priceMin?: number | null;
    priceMax?: number | null;
    state?: string | null;
    city?: string | null;
    locality?: string | null;
    subLocality?: string | null;
    address?: string | null;
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
    address: string;
    category: "" | "RESIDENTIAL" | "COMMERCIAL" | "AGRICULTURAL";
    propertyType: "" | "FARMLAND" | "DUPLEX" | "FLAT" | "PLOT";
    furnishingStatus: "" | "FullyFurnished" | "SemiFurnished" | "Unfurnished" | "FencedWired" | "FertileLand" | "OpenLand" | "Cultivated";
    availabilityStatus: "" | "ReadyToMove" | "UnderConstruction";
    ageOfProperty: "" | "ZeroToOne" | "OneToThree" | "ThreeToSix" | "SixToTen" | "TenPlus";
    propertyFacing: "" | "East" | "West" | "North" | "South" | "NorthEast" | "NorthWest" | "SouthEast" | "SouthWest";
    numberOfRooms: string;
    numberOfBathrooms: string;
    numberOfBalcony: string;
    numberOfFloors: string;
    coveredParking: string;
    uncoveredParking: string;
    amenities: string;
    locationAdvantages: string;
    allInclusivePrice: boolean;
    negotiablePrice: boolean;
    govtChargesTaxIncluded: boolean;
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
    address: "",
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
    coveredParking: "",
    uncoveredParking: "",
    amenities: "",
    locationAdvantages: "",
    allInclusivePrice: false,
    negotiablePrice: false,
    govtChargesTaxIncluded: false,
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
    const [switchTouched, setSwitchTouched] = useState({
        allInclusivePrice: false,
        negotiablePrice: false,
        govtChargesTaxIncluded: false,
    });

    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

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
            address: toOptionalString(form.address),
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
            coveredParking: toOptionalNumber(form.coveredParking),
            uncoveredParking: toOptionalNumber(form.uncoveredParking),
            amenities: toOptionalArray(form.amenities),
            locationAdvantages: toOptionalArray(form.locationAdvantages),
            allInclusivePrice: switchTouched.allInclusivePrice ? form.allInclusivePrice : undefined,
            negotiablePrice: switchTouched.negotiablePrice ? form.negotiablePrice : undefined,
            govtChargesTaxIncluded: switchTouched.govtChargesTaxIncluded ? form.govtChargesTaxIncluded : undefined,
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
                </CardHeader>

                <CardContent className="space-y-6">
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
                                <SelectContent>
                                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                                    <SelectItem value="SOLD_OUT">SOLD_OUT</SelectItem>
                                    <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Notes</FieldLabel>
                            <Input
                                value={form.notes}
                                onChange={(e) => setField("notes", e.target.value)}
                                className="h-10 border-2 bg-white"
                                placeholder="Optional notes for this conversion"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Title Override</FieldLabel>
                            <Input value={form.title} onChange={(e) => setField("title", e.target.value)} className="h-10 border-2 bg-white" placeholder={existing?.title ?? ""} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Description Override</FieldLabel>
                            <Input value={form.description} onChange={(e) => setField("description", e.target.value)} className="h-10 border-2 bg-white" placeholder={existing?.description ?? ""} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Listing Price</FieldLabel>
                            <Input type="number" value={form.listingPrice} onChange={(e) => setField("listingPrice", e.target.value)} className="h-10 border-2 bg-white" placeholder={existing?.listingPrice?.toString() ?? ""} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Price Min</FieldLabel>
                            <Input type="number" value={form.priceMin} onChange={(e) => setField("priceMin", e.target.value)} className="h-10 border-2 bg-white" placeholder={existing?.priceMin?.toString() ?? ""} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Price Max</FieldLabel>
                            <Input type="number" value={form.priceMax} onChange={(e) => setField("priceMax", e.target.value)} className="h-10 border-2 bg-white" placeholder={existing?.priceMax?.toString() ?? ""} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Category</FieldLabel>
                            <Select value={form.category} onValueChange={(v) => setField("category", v as FormState["category"])}>
                                <SelectTrigger className="h-10 border-2 bg-white w-full"><SelectValue placeholder={existing?.category ?? "Select category"} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RESIDENTIAL">RESIDENTIAL</SelectItem>
                                    <SelectItem value="COMMERCIAL">COMMERCIAL</SelectItem>
                                    <SelectItem value="AGRICULTURAL">AGRICULTURAL</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Property Type</FieldLabel>
                            <Select value={form.propertyType} onValueChange={(v) => setField("propertyType", v as FormState["propertyType"])}>
                                <SelectTrigger className="h-10 border-2 bg-white w-full"><SelectValue placeholder={existing?.propertyType ?? "Select property type"} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FARMLAND">FARMLAND</SelectItem>
                                    <SelectItem value="DUPLEX">DUPLEX</SelectItem>
                                    <SelectItem value="FLAT">FLAT</SelectItem>
                                    <SelectItem value="PLOT">PLOT</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>State</FieldLabel>
                            <Input value={form.state} onChange={(e) => setField("state", e.target.value)} className="h-10 border-2 bg-white" placeholder={existing?.state ?? ""} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>City</FieldLabel>
                            <Input value={form.city} onChange={(e) => setField("city", e.target.value)} className="h-10 border-2 bg-white" placeholder={existing?.city ?? ""} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Locality</FieldLabel>
                            <Input value={form.locality} onChange={(e) => setField("locality", e.target.value)} className="h-10 border-2 bg-white" placeholder={existing?.locality ?? ""} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Sub Locality</FieldLabel>
                            <Input value={form.subLocality} onChange={(e) => setField("subLocality", e.target.value)} className="h-10 border-2 bg-white" placeholder={existing?.subLocality ?? ""} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Rooms</FieldLabel>
                            <Input type="number" min={0} value={form.numberOfRooms} onChange={(e) => setField("numberOfRooms", e.target.value)} className="h-10 border-2 bg-white" placeholder={existing?.numberOfRooms?.toString() ?? ""} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Bathrooms</FieldLabel>
                            <Input type="number" min={0} value={form.numberOfBathrooms} onChange={(e) => setField("numberOfBathrooms", e.target.value)} className="h-10 border-2 bg-white" placeholder={existing?.numberOfBathrooms?.toString() ?? ""} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Balcony</FieldLabel>
                            <Input type="number" min={0} value={form.numberOfBalcony} onChange={(e) => setField("numberOfBalcony", e.target.value)} className="h-10 border-2 bg-white" placeholder={existing?.numberOfBalcony?.toString() ?? ""} />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Floors</FieldLabel>
                            <Input type="number" min={0} value={form.numberOfFloors} onChange={(e) => setField("numberOfFloors", e.target.value)} className="h-10 border-2 bg-white" placeholder={existing?.numberOfFloors?.toString() ?? ""} />
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Amenities (comma separated)</FieldLabel>
                            <Input
                                value={form.amenities}
                                onChange={(e) => setField("amenities", e.target.value)}
                                className="h-10 border-2 bg-white"
                                placeholder={existing?.amenities?.length ? existing.amenities.join(", ") : "Gym, Lift, Security"}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <FieldLabel>Location Advantages (comma separated)</FieldLabel>
                            <Input
                                value={form.locationAdvantages}
                                onChange={(e) => setField("locationAdvantages", e.target.value)}
                                className="h-10 border-2 bg-white"
                                placeholder={existing?.locationAdvantages?.length ? existing.locationAdvantages.join(", ") : "Near metro, Near school"}
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
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 bg-blue-600 hover:bg-blue-700">
                        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                        {isSubmitting ? "Updating..." : "Update Exclusive Property"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

