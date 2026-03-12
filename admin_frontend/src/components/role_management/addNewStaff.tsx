"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card"
import { FieldLabel } from "../ui/field"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Trash2, Pencil } from "lucide-react"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api";
import { AxiosError } from "axios";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
interface CreateStaffInput {
    firstName: string;
    lastName: string;
    age: number;
    gender: "MALE" | "FEMALE" | "OTHER";
    phone: string;
    email: string;
    password: string;
    role: "SUPER_ADMIN" | "ADMIN" | "VIEWER" | "CUSTOMER_SUPPORT";
}

const formatPhoneWithCountryCode = (phone: string): string | undefined => {
    const trimmed = phone.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith("+")) return trimmed; // Already has country code
    const digitsOnly = trimmed.replace(/\D/g, "");
    // If already has 91 prefix (e.g. 919876543210), add + and return
    if (digitsOnly.startsWith("91") && digitsOnly.length >= 11) return `+${digitsOnly}`;
    return `+91${digitsOnly}`;
};

const createStaff = async (input: CreateStaffInput) => {
    const payload = {
        ...input,
        age: input.age > 0 ? input.age : undefined,
        phone: formatPhoneWithCountryCode(input.phone),
    };
    const response = await api.post("/staff/management/create-staff", payload);
    return response.data;
};

export function AddNewStaff() {
    const router = useRouter();
    const [apiError, setApiError] = useState<string | null>(null);
    const [input, setInput] = useState<CreateStaffInput>({
        firstName: "",
        lastName: "",
        age: 0,
        gender: "MALE",
        phone: "",
        email: "",
        password: "",
        role: "ADMIN",
    });
    const [showPassword, setShowPassword] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const addNewStaffMutation = useMutation({
        mutationFn: createStaff,
        onSuccess: () => {
            setSuccessMessage("Admin staff created successfully.");
            setApiError(null);
            setInput({
                firstName: "",
                lastName: "",
                age: 0,
                gender: "MALE",
                phone: "",
                email: "",
                password: "",
                role: "ADMIN",
            });
        },
        onError: (error) => {
            if (error instanceof AxiosError && error.response?.status === 401) {
                router.replace("/signin");
                return;
            }
            const msg = error instanceof AxiosError
                ? (error.response?.data as { error?: string })?.error || error.message
                : "Failed to create staff";
            setApiError(msg);
        },
    });
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setConfirmOpen(true);
    };

    const runCreate = () => {
        setConfirmOpen(false);
        addNewStaffMutation.mutate(input);
    };
    return (
        <div className="p-6">
            <Card className="relative max-w-5xl">
                <button className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 cursor-pointer">
                </button>

                <CardHeader className="pb-0">
                    <CardTitle className="text-xl font-semibold">
                        Add New Admin Staff
                    </CardTitle>
                    <CardDescription>
                        Create an access profile for your internal staff.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="p-6 pt-2">
                        {successMessage && (
                            <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                                {successMessage}
                            </div>
                        )}
                        {apiError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                                {apiError}
                            </div>
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
                                            onChange={(e) => setInput((p) => ({ ...p, firstName: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <FieldLabel>Last Name</FieldLabel>
                                        <Input
                                            placeholder="eg. Doe"
                                            className="h-10 border bg-white"
                                            value={input.lastName}
                                            onChange={(e) => setInput((p) => ({ ...p, lastName: e.target.value }))}
                                            required
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
                                            onChange={(e) => setInput((p) => ({ ...p, age: parseInt(e.target.value, 10) || 0 }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <FieldLabel>Select Gender</FieldLabel>
                                        <Select
                                            value={input.gender}
                                            onValueChange={(v) => setInput((p) => ({ ...p, gender: v as "MALE" | "FEMALE" | "OTHER" }))}
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
                                    <FieldLabel>Enter mobile number <span className="text-xs text-muted-foreground font-normal">(+91 added automatically)</span></FieldLabel>
                                    <Input
                                        type="tel"
                                        placeholder="eg. 9876543210"
                                        className="h-10 border bg-white"
                                        value={input.phone}
                                        onChange={(e) => setInput((p) => ({ ...p, phone: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <FieldLabel>Enter email</FieldLabel>
                                    <Input
                                        type="email"
                                        placeholder="eg. testemail123@gmail.com"
                                        className="h-10 border bg-white"
                                        value={input.email}
                                        onChange={(e) => setInput((p) => ({ ...p, email: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Right Column — Password + Role */}
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <FieldLabel>
                                        Enter password{" "}
                                        <span className="text-xs text-muted-foreground font-normal">
                                            (A-Z, a-z, 0-9, Symbols(@,#,%, etc.))
                                        </span>
                                    </FieldLabel>

                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            className="h-10 border bg-white pr-10"
                                            value={input.password}
                                            onChange={(e) =>
                                                setInput((p) => ({ ...p, password: e.target.value }))
                                            }
                                            required
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
                                        onValueChange={(v) => setInput((p) => ({ ...p, role: v as typeof input.role }))}
                                        className="gap-4"
                                    >
                                        {roles.map((role) => (
                                            <Label
                                                key={role.value}
                                                htmlFor={role.value}
                                                className="flex items-start gap-3 cursor-pointer"
                                            >
                                                <RadioGroupItem
                                                    value={role.value}
                                                    id={role.value}
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
                        <Button type="button" variant="outline" className="gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 shadow-none">
                            <Trash2 className="size-4" />
                            Cancel
                        </Button>
                        <Button type="submit" className="gap-2 bg-blue-500 hover:bg-blue-700 text-white" disabled={addNewStaffMutation.isPending}>
                            <Pencil className="size-4" />
                            {addNewStaffMutation.isPending ? "Creating..." : "Create Admin Staff"}
                        </Button>
                    </CardFooter>
                </form>

                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Create Admin Staff</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to create admin staff for{" "}
                                <strong>
                                    {input.firstName} {input.lastName}
                                </strong>
                                ? They will receive access based on the selected role.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="gap-2 bg-blue-500 hover:bg-blue-700 text-white"
                                onClick={runCreate}
                                disabled={addNewStaffMutation.isPending}
                            >
                                <Pencil className="size-4" />
                                {addNewStaffMutation.isPending ? "Creating..." : "Confirm"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Card>
        </div>
    )
}
