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
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type RedeemGemsDialogProps = {
    trigger: React.ReactNode;
    prefillEmail?: string;
};

export function RedeemGemsDialog({ trigger, prefillEmail }: RedeemGemsDialogProps) {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    const [open, setOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userEmail, setUserEmail] = useState(prefillEmail ?? "");
    const [noOfGems, setNoOfGems] = useState("");
    const [otp, setOtp] = useState("");
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [otpError, setOtpError] = useState<string | null>(null);

    const clearMessages = () => {
        setMessage(null);
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
        setNoOfGems("");
        setOtp("");
        if (!prefillEmail) setUserEmail("");
        clearMessages();
    };

    const handleSendOtp = async () => {
        clearMessages();
        if (!userEmail.trim()) {
            setError("Email is required");
            return;
        }
        try {
            setIsSendingOtp(true);
            await api.post("/staff/gems/send-otp", { email: userEmail.trim() });
            setMessage(`OTP sent to ${userEmail.trim()}`);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setIsSendingOtp(false);
        }
    };

    const canSubmit = useMemo(
        () => Boolean(userEmail.trim() && Number(noOfGems) > 0 && otp.trim()),
        [userEmail, noOfGems, otp]
    );

    const handleRedeemClick = () => {
        clearMessages();
        if (!canSubmit) {
            setError("Email, gems and OTP are required");
            return;
        }
        setConfirmOpen(true);
    };

    const handleConfirmRedemption = async () => {
        clearMessages();
        if (!canSubmit) return;
        try {
            setIsSubmitting(true);
            const payload = {
                userEmail: userEmail.trim(),
                noOfGems: Number(noOfGems),
                otp: otp.trim(),
                type: "GEM_REDEEM",
            };
            if (isSuperAdmin) {
                await api.post("/staff/gems/direct-redeem-gems", payload);
                setMessage("Gems redeemed successfully");
            } else {
                await api.post("/staff/gems/redeem-user-gems", payload);
                setMessage("Redemption request created and sent for super admin approval");
            }
            setConfirmOpen(false);
        } catch (err) {
            const msg = getErrorMessage(err);
            if (msg.toLowerCase().includes("otp")) {
                setOtpError(msg);
            } else {
                setError(msg);
            }
            setConfirmOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(value) => {
                    setOpen(value);
                    if (!value) resetDialog();
                    if (value && prefillEmail) setUserEmail(prefillEmail);
                }}
            >
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Redeem Gems from User</DialogTitle>
                        <DialogDescription>
                            Fill in the user email and gems to redeem. OTP must be validated.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div>
                            <p className="text-xs mb-1 text-gray-600">Email *</p>
                            <Input
                                type="email"
                                value={userEmail}
                                onChange={(e) => setUserEmail(e.target.value)}
                                placeholder="Enter user email"
                                readOnly={!!prefillEmail}
                                className={prefillEmail ? "bg-zinc-50" : ""}
                            />
                        </div>
                        <div>
                            <p className="text-xs mb-1 text-gray-600">No. of Gems *</p>
                            <Input
                                type="number"
                                min={1}
                                value={noOfGems}
                                onChange={(e) => setNoOfGems(e.target.value)}
                                placeholder="Enter gems to redeem"
                            />
                        </div>
                        <div>
                            <p className="text-xs mb-1 text-gray-600">OTP *</p>
                            <Input
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter OTP"
                            />
                            {otpError && <p className="text-xs mt-1 text-red-500">{otpError}</p>}
                        </div>
                    </div>

                    {message && <p className="text-sm text-green-600">{message}</p>}
                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
                        <Button variant="outline" onClick={handleSendOtp} disabled={isSendingOtp}>
                            {isSendingOtp ? "Sending OTP..." : "Send OTP to User"}
                        </Button>
                        <Button onClick={handleRedeemClick} disabled={!canSubmit}>
                            Redeem Gems
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Redemption</DialogTitle>
                        <DialogDescription>
                            You are redeeming{" "}
                            <span className="font-bold text-black">{noOfGems}</span> Gems from{" "}
                            <span className="font-bold text-black">{userEmail}</span>.
                            <br />
                            Confirm Redemption?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmRedemption}
                            disabled={isSubmitting || !canSubmit}
                        >
                            {isSubmitting ? "Processing..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
