"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card"
import { FieldLabel } from "../ui/field"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Pencil, OctagonMinus, XIcon, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { api } from "@/lib/api"
import { AxiosError } from "axios"
import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

const roles = [
    {
        value: "ADMIN",
        label: "Admin",
        description: "Limited control. Can have view and add access for everything.",
    },
    {
        value: "CUSTOMER_SUPPORT",
        label: "Customer Support",
        description: "Resolve issues raised by user, can manage raised query tickets only.",
    },
]

interface StaffData {
    id: string
    firstName: string
    lastName: string
    age: number | null
    gender: "MALE" | "FEMALE" | "OTHER"
    phone: string | null
    email: string
    role: "SUPER_ADMIN" | "ADMIN" | "VIEWER" | "CUSTOMER_SUPPORT"
    isActive: boolean
}

interface UpdateStaffInput {
    firstName?: string
    lastName?: string
    age?: number
    gender: "MALE" | "FEMALE" | "OTHER"
    phone?: string
    email?: string
    password?: string
    role: "SUPER_ADMIN" | "ADMIN" | "VIEWER" | "CUSTOMER_SUPPORT"
}

const defaultInput: UpdateStaffInput = {
    firstName: "",
    lastName: "",
    age: 0,
    gender: "MALE",
    phone: "",
    email: "",
    password: "",
    role: "ADMIN",
}

const formatPhoneWithCountryCode = (phone: string): string | undefined => {
    const trimmed = phone.trim()
    if (!trimmed) return undefined
    if (trimmed.startsWith("+")) return trimmed
    const digitsOnly = trimmed.replace(/\D/g, "")
    if (digitsOnly.startsWith("91") && digitsOnly.length >= 11) return `+${digitsOnly}`
    return `+91${digitsOnly}`
}

const fetchStaffById = async (id: string): Promise<StaffData> => {
    const response = await api.get(`/staff/management/get-staff/${id}`)
    return response.data.staff
}

const updateStaffApi = async ({ id, data }: { id: string; data: UpdateStaffInput }) => {
    const payload = {
        ...data,
        phone: data.phone ? formatPhoneWithCountryCode(data.phone) : undefined,
    }
    const response = await api.put(`/staff/management/update-staff/${id}`, payload)
    return response.data
}

const blockStaffApi = async (id: string) => {
    const response = await api.put(`/staff/management/update-staff/${id}`, { isActive: false })
    return response.data
}

const mapStaffToInput = (staff: StaffData): UpdateStaffInput => ({
    firstName: staff.firstName ?? "",
    lastName: staff.lastName ?? "",
    age: staff.age ?? 0,
    gender: staff.gender ?? "MALE",
    phone: staff.phone ?? "",
    email: staff.email ?? "",
    password: "",
    role: staff.role ?? "ADMIN",
})

export function EditStaff({ staffId }: { staffId: string }) {
    const router = useRouter()
    const [apiError, setApiError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [overrides, setOverrides] = useState<Partial<UpdateStaffInput>>({})
    const [showPassword, setShowPassword] = useState(false)

    const { data: staff, isLoading, isError, error: fetchError } = useQuery({
        queryKey: ["staff", staffId],
        queryFn: () => fetchStaffById(staffId),
        enabled: !!staffId,
    })

    const input = useMemo<UpdateStaffInput>(() => {
        const base = staff ? mapStaffToInput(staff) : defaultInput
        return { ...base, ...overrides }
    }, [staff, overrides])

    const updateMutation = useMutation({
        mutationFn: updateStaffApi,
        onSuccess: () => {
            setApiError(null)
            setSuccessMsg("Staff updated successfully!")
            setTimeout(() => setSuccessMsg(null), 3000)
        },
        onError: (error) => {
            if (error instanceof AxiosError && error.response?.status === 401) {
                router.replace("/signin")
                return
            }
            const msg =
                error instanceof AxiosError
                    ? (error.response?.data as { message?: string })?.message || error.message
                    : "Failed to update staff"
            setApiError(msg)
        },
    })

    const blockMutation = useMutation({
        mutationFn: blockStaffApi,
        onSuccess: () => {
            setApiError(null)
            setSuccessMsg("Staff blocked successfully!")
            setTimeout(() => router.push("/role-management"), 1500)
        },
        onError: (error) => {
            const msg =
                error instanceof AxiosError
                    ? (error.response?.data as { message?: string })?.message || error.message
                    : "Failed to block staff"
            setApiError(msg)
        },
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setConfirmOpen(true)
    }

    const handleConfirmUpdate = () => {
        setConfirmOpen(false)
        setApiError(null)
        setSuccessMsg(null)
        const payload: UpdateStaffInput = { ...input }
        // Only send password if user typed a new one
        if (!payload.password) {
            delete payload.password
        }
        // Only send age if > 0
        if (!payload.age || payload.age <= 0) {
            delete payload.age
        }
        updateMutation.mutate({ id: staffId, data: payload })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="size-8 animate-spin text-blue-500" />
                <span className="ml-2 text-muted-foreground">Loading staff details...</span>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="p-6">
                <div className="p-4 rounded-lg bg-red-50 text-red-600">
                    Failed to load staff details:{" "}
                    {fetchError instanceof AxiosError
                        ? (fetchError.response?.data as { message?: string })?.message || fetchError.message
                        : "Unknown error"}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            <Card className="relative max-w-5xl">
                <CardHeader className="pb-0">
                    <CardTitle className="text-xl font-semibold">Edit Details</CardTitle>
                    <CardDescription>Update details of admin staff.</CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="p-6 pt-2">
                        {apiError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{apiError}</div>
                        )}
                        {successMsg && (
                            <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-600 text-sm">{successMsg}</div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {/* Left Column — Personal Information */}
                            <div className="space-y-5">
                                <h3 className="text-base font-semibold">Personal Information</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <FieldLabel>First Name</FieldLabel>
                                        <Input
                                            placeholder="eg. John"
                                            className="h-10 border bg-white"
                                            value={input.firstName}
                                            onChange={(e) => setOverrides((p) => ({ ...p, firstName: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <FieldLabel>Last Name</FieldLabel>
                                        <Input
                                            placeholder="eg. Doe"
                                            className="h-10 border bg-white"
                                            value={input.lastName}
                                            onChange={(e) => setOverrides((p) => ({ ...p, lastName: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <FieldLabel>Enter Age</FieldLabel>
                                        <Input
                                            type="number"
                                            placeholder="eg. 28"
                                            className="h-10 border bg-white"
                                            min={0}
                                            value={input.age || ""}
                                            onChange={(e) =>
                                                setOverrides((p) => ({ ...p, age: parseInt(e.target.value, 10) || 0 }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <FieldLabel>Select Gender</FieldLabel>
                                        <Select
                                            value={input.gender}
                                            onValueChange={(v) =>
                                                setOverrides((p) => ({ ...p, gender: v as "MALE" | "FEMALE" | "OTHER" }))
                                            }
                                        >
                                            <SelectTrigger className="h-10 border shadow-none bg-white">
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
                                    <FieldLabel>
                                        Enter mobile number{" "}
                                        <span className="text-xs text-muted-foreground font-normal">
                                            (+91 added automatically)
                                        </span>
                                    </FieldLabel>
                                    <Input
                                        type="tel"
                                        placeholder="eg. 9876543210"
                                        className="h-10 border bg-white"
                                        value={input.phone}
                                        onChange={(e) => setOverrides((p) => ({ ...p, phone: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <FieldLabel>Enter email</FieldLabel>
                                    <Input
                                        type="email"
                                        placeholder="eg. testemail123@gmail.com"
                                        className="h-10 border bg-white"
                                        value={input.email}
                                        onChange={(e) => setOverrides((p) => ({ ...p, email: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Right Column — Password + Role */}
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <FieldLabel>
                                        New password{" "}
                                        <span className="text-xs text-muted-foreground font-normal">
                                            (leave blank to keep current)
                                        </span>
                                    </FieldLabel>

                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            className="h-10 border bg-white pr-10"
                                            placeholder="Enter new password"
                                            value={input.password}
                                            onChange={(e) =>
                                                setOverrides((p) => ({ ...p, password: e.target.value }))
                                            }
                                            minLength={6}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((p) => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 border-2 rounded-lg p-4">
                                    <h3 className="text-base font-semibold">Select Role</h3>

                                    <RadioGroup
                                        value={input.role}
                                        onValueChange={(v) =>
                                            setOverrides((p) => ({ ...p, role: v as typeof input.role }))
                                        }
                                        className="gap-4"
                                    >
                                        {roles.map((role) => (
                                            <Label
                                                key={role.value}
                                                htmlFor={`edit-${role.value}`}
                                                className="flex items-start gap-3 cursor-pointer"
                                            >
                                                <RadioGroupItem
                                                    value={role.value}
                                                    id={`edit-${role.value}`}
                                                    className="mt-1 size-5 border-2 border-blue-400 text-blue-600"
                                                />
                                                <div>
                                                    <span className="text-[15px] font-semibold text-green-600">
                                                        {role.label}
                                                    </span>
                                                    <p className="text-sm text-muted-foreground leading-snug">
                                                        {role.description}
                                                    </p>
                                                </div>
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="justify-end gap-3 px-6 mb-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 shadow-none"
                            onClick={() => blockMutation.mutate(staffId)}
                            disabled={blockMutation.isPending}
                        >
                            <OctagonMinus className="size-4 text-orange-500" />
                            {blockMutation.isPending ? "Blocking..." : "Block User"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 shadow-none"
                            onClick={() => router.push("/role-management")}
                        >
                            <XIcon className="size-5 text-red-500" />
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="gap-2 bg-blue-500 hover:bg-blue-700 text-white"
                            disabled={updateMutation.isPending}
                        >
                            <Pencil className="size-4" />
                            {updateMutation.isPending ? "Updating..." : "Update Changes"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Update</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to update this staff member&apos;s details? This action will overwrite the existing information.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            className="bg-blue-500 hover:bg-blue-700 text-white"
                            onClick={handleConfirmUpdate}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? "Updating..." : "Yes, Update"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
