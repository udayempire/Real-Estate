"use client"
import { useRef, useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card"
import { FieldLabel } from "../ui/field"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X, Pencil, OctagonMinus, XIcon, Upload, ImageIcon, Eye, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
type KycItem = {
    id: string
    type: "AADHARCARD" | "PANCARD"
    docNo: string
    status: "PENDING" | "VERIFIED" | "REJECTED"
    imageUrl: string
}

type EditUserData = {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    avatar: string | null
    age: number | null
    gender: "MALE" | "FEMALE" | "OTHER" | null
    referralCode: string
    isVerifiedSeller: boolean
    blueTick: boolean
    isBlocked: boolean
    kyc: KycItem[]
}

function AvatarUpload({ currentAvatar }: { currentAvatar: string | null }) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string | null>(currentAvatar);

    useEffect(() => {
        setPreview(currentAvatar);
    }, [currentAvatar]);

    const handleClick = () => {
        fileInputRef.current?.click();
    }
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPreview(imageUrl);
        }
    }
    return (
        <div className="flex justify-center items-center">
            <div
                onClick={handleClick}
                className="h-28 w-28 rounded-full border-2 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition border-black"
            >
                {preview ? (
                    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                    <ImageIcon className="size-5 text-zinc-500" />
                )}
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
        </div>
    )
}

export function EditUser() {
    const params = useParams<{ id: string }>()
    const userId = Array.isArray(params?.id) ? params.id[0] : params?.id
    const router = useRouter()

    const [user, setUser] = useState<EditUserData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [age, setAge] = useState("")
    const [gender, setGender] = useState("")
    const [referralCode, setReferralCode] = useState("")
    const [isVerifiedSeller, setIsVerifiedSeller] = useState(false)
    const [blueTick, setBlueTick] = useState(false)
    const [aadharStatus, setAadharStatus] = useState<KycItem["status"] | "">("")
    const [panStatus, setPanStatus] = useState<KycItem["status"] | "">("")
    const [confirmOpen, setConfirmOpen] = useState(false)

    useEffect(() => {
        if (!userId) return
        const fetchUser = async () => {
            try {
                setIsLoading(true)
                const res = await api.get(`/staff/users/${userId}/edit`)
                const data: EditUserData = res.data.user
                setUser(data)
                setFirstName(data.firstName)
                setLastName(data.lastName)
                setEmail(data.email)
                setPhone(data.phone)
                setAge(data.age?.toString() ?? "")
                setGender(data.gender ?? "")
                setReferralCode(data.referralCode)
                setIsVerifiedSeller(data.isVerifiedSeller)
                setBlueTick(data.blueTick ?? false)
                const aadhar = data.kyc.find((k) => k.type === "AADHARCARD")
                const pan = data.kyc.find((k) => k.type === "PANCARD")
                if (aadhar) setAadharStatus(aadhar.status)
                if (pan) setPanStatus(pan.status)
            } catch (err) {
                console.error("Failed to fetch user for edit:", err)
                setError("Failed to load user details")
            } finally {
                setIsLoading(false)
            }
        }
        void fetchUser()
    }, [userId])

    const aadharKyc = user?.kyc.find((k) => k.type === "AADHARCARD")
    const panKyc = user?.kyc.find((k) => k.type === "PANCARD")

    const handleKycStatusChange = async (kycId: string, newStatus: KycItem["status"]) => {
        if (!userId) return
        try {
            await api.put(`/staff/users/${userId}/kyc/${kycId}`, { status: newStatus })
        } catch (err) {
            console.error("Failed to update KYC status:", err)
            setError("Failed to update KYC status")
        }
    }

    const handleSubmit = async () => {
        if (!userId) return
        try {
            setIsSaving(true)
            await api.put(`/staff/users/${userId}`, {
                firstName,
                lastName,
                email,
                phone,
                age: age ? parseInt(age, 10) : undefined,
                gender: gender || undefined,
                isVerifiedSeller,
                blueTick,
            })
            router.push(`/user/${userId}`)
        } catch (err) {
            console.error("Failed to update user:", err)
            setError("Failed to update user")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading user details...</span>
            </div>
        )
    }

    if (error && !user) {
        return <div className="p-6 text-center text-red-500">{error}</div>
    }

    return (
        <div className="p-6">
            <Card className="relative max-w-5xl">
                <button
                    onClick={() => router.back()}
                    className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                    <X className="size-6" />
                </button>

                <CardHeader className="pb-0">
                    <CardTitle className="text-xl font-semibold">
                        Edit User Details
                    </CardTitle>
                    <CardDescription>
                        Update details of existing user.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {/* Left Column — Avatar + KYC */}
                        <div className="space-y-5">
                            <div className="space-y-4">
                                <AvatarUpload currentAvatar={user?.avatar ?? null} />
                                <div className="flex font-medium text-zinc-500 justify-center items-center gap-2">
                                    <Upload className="size-5" />
                                    <p>Upload Image</p>
                                    <p>(max 512 KB)</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center space-x-2">
                                <Label htmlFor="verified-seller" className="font-medium text-sm">
                                    Verified Seller <span className="text-[12px] text-zinc-500">(Provide Verified Badge)</span>
                                </Label>
                                <Switch
                                    id="verified-seller"
                                    checked={isVerifiedSeller}
                                    onCheckedChange={setIsVerifiedSeller}
                                />
                            </div>
                            <div className="flex justify-between items-center space-x-2">
                                <Label htmlFor="blue-tick" className="font-medium text-sm">
                                    Blue Tick <span className="text-[12px] text-zinc-500">(Provide Blue Tick)</span>
                                </Label>
                                <Switch
                                    id="blue-tick"
                                    checked={blueTick}
                                    onCheckedChange={setBlueTick}
                                />
                            </div>

                            <h3 className="text-base font-semibold">KYC Details</h3>
                            <div className="space-y-1.5">
                                <FieldLabel className="font-medium">Aadhaar Number</FieldLabel>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        value={aadharKyc?.docNo ?? ""}
                                        placeholder="eg. 1234 5678 9012"
                                        className="h-10 border-2 bg-white flex-1"
                                        readOnly
                                    />
                                    {aadharKyc?.imageUrl && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 shrink-0"
                                            onClick={() => window.open(aadharKyc.imageUrl, "_blank")}
                                        >
                                            <Eye className="size-4" />
                                        </Button>
                                    )}
                                </div>
                                {aadharKyc && (
                                    <Select
                                        value={aadharStatus}
                                        onValueChange={(val) => {
                                            const status = val as KycItem["status"]
                                            setAadharStatus(status)
                                            void handleKycStatusChange(aadharKyc.id, status)
                                        }}
                                    >
                                        <SelectTrigger className={`h-10 w-42 text-sm font-medium border-2 shadow-none ${aadharStatus === "VERIFIED" ? "text-green-600 border-green-200 bg-green-50" :
                                                aadharStatus === "REJECTED" ? "text-red-600 border-red-200 bg-red-50" :
                                                    "text-yellow-600 border-yellow-200 bg-yellow-50"
                                            }`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="PENDING">Pending</SelectItem>
                                                <SelectItem value="VERIFIED">Verified</SelectItem>
                                                <SelectItem value="REJECTED">Rejected</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <FieldLabel>PAN Number</FieldLabel>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        value={panKyc?.docNo ?? ""}
                                        placeholder="eg. ABCDE1234F"
                                        className="h-10 border-2 bg-white flex-1"
                                        readOnly
                                    />
                                    {panKyc?.imageUrl && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 shrink-0"
                                            onClick={() => window.open(panKyc.imageUrl, "_blank")}
                                        >
                                            <Eye className="size-4" />
                                        </Button>
                                    )}
                                </div>
                                {panKyc && (
                                    <Select
                                        value={panStatus}
                                        onValueChange={(val) => {
                                            const status = val as KycItem["status"]
                                            setPanStatus(status)
                                            void handleKycStatusChange(panKyc.id, status)
                                        }}
                                    >
                                        <SelectTrigger className={`h-10 w-42 text-sm font-medium border-2 shadow-none ${panStatus === "VERIFIED" ? "text-green-600 border-green-200 bg-green-50" :
                                                panStatus === "REJECTED" ? "text-red-600 border-red-200 bg-red-50" :
                                                    "text-yellow-600 border-yellow-200 bg-yellow-50"
                                            }`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="PENDING">Pending</SelectItem>
                                                <SelectItem value="VERIFIED">Verified</SelectItem>
                                                <SelectItem value="REJECTED">Rejected</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        {/* Right Column — Personal Information */}
                        <div className="space-y-5">
                            <h3 className="text-base font-semibold">Personal Information</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <FieldLabel>First Name</FieldLabel>
                                    <Input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="eg. John"
                                        className="h-10 border-2 bg-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <FieldLabel>Last Name</FieldLabel>
                                    <Input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="eg. Doe"
                                        className="h-10 border-2 bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <FieldLabel>Enter Age</FieldLabel>
                                    <Input
                                        type="number"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        placeholder="eg. 28"
                                        className="h-10 border-2 bg-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <FieldLabel>Select Gender</FieldLabel>
                                    <Select value={gender} onValueChange={setGender}>
                                        <SelectTrigger className="h-10 border-2 shadow-none bg-white">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="MALE">Male</SelectItem>
                                                <SelectItem value="FEMALE">Female</SelectItem>
                                                <SelectItem value="OTHER">Other</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <FieldLabel>Enter mobile number</FieldLabel>
                                <Input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="eg. 87988 88797"
                                    className="h-10 border-2 bg-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <FieldLabel>Enter email</FieldLabel>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="eg. testemail123@gmail.com"
                                    className="h-10 border-2 bg-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <FieldLabel>Sponsor code</FieldLabel>
                                <Input
                                    type="text"
                                    value={referralCode}
                                    placeholder="eg. DHJS6755GHGHGHK"
                                    className="h-10 border-2 bg-zinc-50"
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm mt-4">{error}</p>
                    )}
                </CardContent>

                <CardFooter className="justify-end gap-3 px-6 mb-3">
                    <Button variant="outline" className="gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 shadow-none">
                        <OctagonMinus className="size-4 text-orange-500" />
                        Block User
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 shadow-none"
                        onClick={() => router.back()}
                    >
                        <XIcon className="size-5 text-red-500" />
                        Cancel
                    </Button>
                    <Button
                        className="gap-2 bg-blue-500 hover:bg-blue-700 text-white"
                        onClick={() => setConfirmOpen(true)}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Pencil className="size-4" />
                        )}
                        {isSaving ? "Saving..." : "Update Changes"}
                    </Button>
                </CardFooter>
            </Card>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Update</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to update the user?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-blue-500 hover:bg-blue-700 text-white"
                            onClick={async () => {
                                setConfirmOpen(false)
                                await handleSubmit()
                            }}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : null}
                            {isSaving ? "Saving..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
