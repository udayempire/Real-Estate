"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card"
import { FieldLabel } from "../ui/field"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Pencil, OctagonMinus, XIcon } from "lucide-react"
import { Label } from "@/components/ui/label"

const roles = [
    {
        value: "admin",
        label: "Admin",
        description: "Limited control. Can have view and add access for everything.",
    },
    {
        value: "customer-support",
        label: "Customer Support",
        description: "Resolve issues raised by user, can manage raised query tickets only.",
    },
]

export function EditStaff() {
    return (
        <div className="p-6">
            <Card className="relative max-w-5xl">
                <CardHeader className="pb-0">
                    <CardTitle className="text-xl font-semibold">
                        Edit Details
                    </CardTitle>
                    <CardDescription>
                        Update details of admin staff.
                    </CardDescription>
                </CardHeader>

                <CardContent className="p-6 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {/* Left Column — Personal Information */}
                        <div className="space-y-5">
                            <h3 className="text-base font-semibold">Personal Information</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <FieldLabel>First Name</FieldLabel>
                                    <Input placeholder="eg. John" className="h-10 border bg-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <FieldLabel>Last Name</FieldLabel>
                                    <Input placeholder="eg. Doe" className="h-10 border bg-white" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <FieldLabel>Enter Age</FieldLabel>
                                    <Input type="number" placeholder="eg. 28" className="h-10 border bg-white" />
                                </div>
                                <div className="space-y-1.5">
                                    <FieldLabel>Select Gender</FieldLabel>
                                    <Select>
                                        <SelectTrigger className="h-10 border shadow-none bg-white">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="transgender">Transgender</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <FieldLabel>Enter mobile number</FieldLabel>
                                <Input type="tel" placeholder="eg. 87988 88797" className="h-10 border bg-white" />
                            </div>

                            <div className="space-y-1.5">
                                <FieldLabel>Enter email</FieldLabel>
                                <Input type="email" placeholder="eg. testemail123@gmail.com" className="h-10 border bg-white" />
                            </div>
                        </div>

                        {/* Right Column — Password + Role */}
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <FieldLabel>Enter password <span className="text-xs text-muted-foreground font-normal">(A-Z, a-z, 0-9, Symbols(@,#,%, etc.))</span></FieldLabel>
                                <Input type="password" className="h-10 border bg-white" />
                            </div>

                            <div className="space-y-4 border-2 rounded-lg p-4">
                                <h3 className="text-base font-semibold">Select Role</h3>

                                <RadioGroup defaultValue="admin" className="gap-4">
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
                    <Button variant="outline" className="gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 shadow-none">
                        <OctagonMinus className="size-4 text-orange-500" />
                        Block User
                    </Button>
                    <Button variant="outline" className="gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 shadow-none">
                        <XIcon className="size-5 text-red-500" />
                        Cancel
                    </Button>
                    <Button className="gap-2 bg-blue-500 hover:bg-blue-700 text-white">
                        <Pencil className="size-4" />
                        Update Changes
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
