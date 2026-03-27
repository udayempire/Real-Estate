"use client";

import { useMemo, useState } from "react";
import { AxiosError } from "axios";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";

type GemRequestType = "EXCLUSIVE_ACQUISITION_REWARD" | "EXCLUSIVE_SALE_REWARD";

type PreviewResponse = {
    success: boolean;
    data: {
        baseGems: number;
        referralPercent: number;
        referralGems: number;
        totalGems: number;
        targetUser: { email: string };
        referralUser: { email: string } | null;
    };
};

type SendGemsDialogProps = {
    trigger: React.ReactNode;
    prefillEmail?: string;
};

export function SendGemsDialog({ trigger, prefillEmail }: SendGemsDialogProps) {
    const [open, setOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [email, setEmail] = useState(prefillEmail ?? "");
    const [baseGems, setBaseGems] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [type, setType] = useState<GemRequestType>("EXCLUSIVE_ACQUISITION_REWARD");
    const [comment, setComment] = useState("");
    const [propertyId, setPropertyId] = useState("");
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isSendingGems, setIsSendingGems] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [otpError, setOtpError] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<PreviewResponse["data"] | null>(null);

    const clearMessages = () => {
        setError(null);
        setOtpError(null);
    };

    const getErrorMessage = (err: unknown) => {
        if (err instanceof AxiosError) {
            const response = err.response?.data as { message?: string } | undefined;
            return response?.message ?? err.message;
        }
        return "Something went wrong";
    };

    const resetDialog = () => {
        setConfirmOpen(false);
        setPreviewData(null);
        setBaseGems("");
        setOtpCode("");
        setComment("");
        setPropertyId("");
        setType("EXCLUSIVE_ACQUISITION_REWARD");
        if (!prefillEmail) setEmail("");
        clearMessages();
    };

    const handleSendOtp = async () => {
        clearMessages();
        if (!email.trim()) {
            setError("Email is required");
            return;
        }
        try {
            setIsSendingOtp(true);
            await api.post("/staff/gems/send-otp", { email: email.trim() });
            toast.success(`OTP sent to ${email.trim()}`, { position: "bottom-center" });
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSendingOtp(false);
        }
    };

    const canPreview = useMemo(() => {
        return Boolean(email.trim() && Number(baseGems) > 0 && otpCode.trim() && type);
    }, [email, baseGems, otpCode, type]);

    const handlePreview = async () => {
        clearMessages();
        if (!canPreview) {
            setError("Email, base gems, OTP and type are required");
            return;
        }
        try {
            setIsPreviewing(true);
            const response = await api.post<PreviewResponse>("/staff/gems/preview", {
                email: email.trim(),
                baseGems: Number(baseGems),
            });
            setPreviewData(response.data.data);
            setConfirmOpen(true);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsPreviewing(false);
        }
    };

    const handleConfirmSendGems = async () => {
        clearMessages();
        if (!canPreview) {
            setError("Email, base gems, OTP and type are required");
            return;
        }
        try {
            setIsSendingGems(true);
            await api.post("/staff/gems/give", {
                email: email.trim(),
                baseGems: Number(baseGems),
                otpCode: otpCode.trim(),
                type,
                comment: comment.trim() || undefined,
                propertyId: propertyId.trim() || undefined,
            });
            setConfirmOpen(false);
            toast.success("Gems sent successfully", { position: "bottom-center" });
        } catch (err) {
            const msg = getErrorMessage(err);
            if (msg.toLowerCase().includes("otp")) {
                setOtpError(msg);
            } else {
                setError(msg);
            }
            setConfirmOpen(false);
        } finally {
            setIsSendingGems(false);
        }
    };

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(value) => {
                    setOpen(value);
                    if (!value) resetDialog();
                    if (value && prefillEmail) setEmail(prefillEmail);
                }}
            >
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Send Gems to User</DialogTitle>
                        <DialogDescription>
                            Fill in the user and gems details to continue.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div>
                            <p className="text-xs mb-1 text-gray-600">Email *</p>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter user email"
                                readOnly={!!prefillEmail}
                                className={prefillEmail ? "bg-zinc-50" : ""}
                            />
                        </div>
                        <div>
                            <p className="text-xs mb-1 text-gray-600">Base Gems *</p>
                            <Input
                                type="number"
                                min={1}
                                value={baseGems}
                                onChange={(e) => setBaseGems(e.target.value)}
                                placeholder="Enter base gems"
                            />
                        </div>
                        <div>
                            <p className="text-xs mb-1 text-gray-600">OTP *</p>
                            <Input
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                placeholder="Enter OTP"
                            />
                            {otpError && <p className="text-xs mt-1 text-red-500">{otpError}</p>}
                        </div>
                        <div>
                            <p className="text-xs mb-1 text-gray-600">Type *</p>
                            <Select value={type} onValueChange={(v) => setType(v as GemRequestType)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EXCLUSIVE_ACQUISITION_REWARD">EXCLUSIVE_ACQUISITION_REWARD</SelectItem>
                                    <SelectItem value="EXCLUSIVE_SALE_REWARD">EXCLUSIVE_SALE_REWARD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <p className="text-xs mb-1 text-gray-600">Property ID (optional)</p>
                            <Input
                                value={propertyId}
                                onChange={(e) => setPropertyId(e.target.value)}
                                placeholder="Enter property ID if payment is for a specific property"
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
                        <Button variant="outline" onClick={handleSendOtp} disabled={isSendingOtp}>
                            {isSendingOtp ? "Sending OTP..." : "Send OTP to User"}
                        </Button>
                        <Button onClick={handlePreview} disabled={isPreviewing}>
                            {isPreviewing ? "Preparing..." : "Send Gems"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Gem Allocation</DialogTitle>
                        <DialogDescription>
                            {previewData ? (
                                <>
                                    <span className="font-bold text-black">{previewData.baseGems}</span> Gems is allotted to email Id{" "}
                                    <span className="font-bold text-black">{previewData.targetUser.email}</span> and 5%{" "}
                                    <span className="font-bold text-black">{previewData.referralGems}</span> Gems is allocated to its referral{" "}
                                    <span className="font-bold text-black">
                                        {previewData.referralUser?.email ?? "N/A"}
                                    </span>.
                                </>
                            ) : (
                                "No preview data available."
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmSendGems} disabled={isSendingGems || !previewData}>
                            {isSendingGems ? "Sending..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
