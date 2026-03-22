"use client";

import { useState } from "react";
import { Building2, Gem, Handshake, IndianRupee, Mail, PenLine, Phone, Gift, OctagonMinus, Unlock, Loader2, IdCardIcon, Eye, Download } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { BlueTick } from "./blueTick";
import { VerifiedSeller } from "./verifiedSeller";
import { UserSellingHistory } from "./userSellingHistory";
import { SendGemsDialog } from "../shared/sendGemsDialog";
import type { FullUserData } from "./types";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AxiosError } from "axios";
import { useAuth } from "@/contexts/AuthContext";

function formatPrice(value: number): string {
    if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `₹ ${(value / 100000).toFixed(1)} Lakh`;
    if (value >= 1000) return `₹ ${(value / 1000).toFixed(1)}K`;
    return `₹ ${value}`;
}

export function UserActionsAndDetails({ user, onUserUpdated }: { user: FullUserData; onUserUpdated?: () => void }) {
    const router = useRouter();
    const { user: authUser } = useAuth();
    const { userStats, properties_by_status } = user;
    const name = `${user.firstName} ${user.lastName}`;
    const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
    const canViewAdminActions = authUser?.role === "ADMIN" || authUser?.role === "SUPER_ADMIN";

    const [blockOpen, setBlockOpen] = useState(false);
    const [unblockOpen, setUnblockOpen] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);
    const [isUnblocking, setIsUnblocking] = useState(false);
    const [blockError, setBlockError] = useState<string | null>(null);
    const [unblockError, setUnblockError] = useState<string | null>(null);

    const handleBlock = async () => {
        try {
            setIsBlocking(true);
            setBlockError(null);
            await api.put(`/staff/users/${user.id}/block`);
            setBlockOpen(false);
            onUserUpdated?.();
        } catch (err) {
            console.error("Block user error:", err);
            const msg = err instanceof AxiosError && (err.response?.data as { message?: string })?.message
                ? String((err.response?.data as { message?: string }).message)
                : "Failed to block user";
            setBlockError(msg);
        } finally {
            setIsBlocking(false);
        }
    };

    const handleUnblock = async () => {
        try {
            setIsUnblocking(true);
            setUnblockError(null);
            await api.put(`/staff/users/${user.id}/unblock`);
            setUnblockOpen(false);
            onUserUpdated?.();
        } catch (err) {
            console.error("Unblock user error:", err);
            const msg = err instanceof AxiosError && (err.response?.data as { message?: string })?.message
                ? String((err.response?.data as { message?: string }).message)
                : "Failed to unblock user";
            setUnblockError(msg);
        } finally {
            setIsUnblocking(false);
        }
    };
    const downloadImage = async (url: string, filename: string) => {
        try {
            const encoded = encodeURIComponent(url);
            const res = await api.get<Blob>(`/staff/users/kyc-proxy-download?url=${encoded}&filename=${encodeURIComponent(filename)}`, { responseType: "blob" });
            const blob = new Blob([res.data], { type: res.headers["content-type"] ?? "application/octet-stream" });
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Download KYC image error:", err);
        }
    };

    return (
        <div className="flex flex-col gap-4 mt-4">
            <div className="flex gap-4 w-full justify-start">
                <Avatar className="h-16 w-16 border-2 border-zinc-500">
                    <AvatarImage src={user.avatar ?? ""} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold text-xl">
                        {name}
                    </div>
                    {user.blueTick && <BlueTick size={7} />}
                    {user.isVerifiedSeller && <VerifiedSeller />}
                </div>
            </div>
            {canViewAdminActions && (
                <div className="grid grid-cols-4 gap-2 items-center flex-wrap ">
                    {user.isBlocked ? (
                        <Button
                            variant="outline"
                            className="gap-2 h-12 w-32 border-green-200 hover:bg-green-50 shadow-none"
                            onClick={() => setUnblockOpen(true)}
                        >
                            <Unlock className="size-5 text-green-600" />
                            Unblock User
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            className="gap-2 h-12 w-32 border-red-200 hover:bg-zinc-100 shadow-none"
                            onClick={() => setBlockOpen(true)}
                        >
                            <OctagonMinus className="size-5 text-orange-500" />
                            Block User
                        </Button>
                    )}
                    <SendGemsDialog
                        prefillEmail={user.email}
                        trigger={
                            <Button variant="outline" className="gap-2 h-12 w-32 border-red-200 hover:bg-zinc-100 shadow-none">
                                <Gem className="size-5 text-green-500" />
                                <p>Send Gems</p>
                            </Button>
                        }
                    />
                    <Button variant="outline" className="gap-2 h-12 w-32 border-red-200 hover:bg-zinc-100   shadow-none"
                        onClick={() => router.push(`/user/edit/${user.id}`)}
                    >
                        <PenLine className="size-5 text-blue-500" />
                        <p>Edit User</p>
                    </Button>
                    <Button variant="outline" className="gap-2 h-12 w-32 border-red-200 hover:bg-zinc-100   shadow-none"
                        onClick={() => router.push(`/user/${user.id}/txn-history`)}
                    >
                        <PenLine className="size-5 text-blue-500" />
                        <p>Txn History</p>
                    </Button>
                </div>
            )}
            {/* Contact Info */}
            <div className="space-y-1.5">
                <h2 className="font-medium text-sm px-0.5">Contact Info</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
                    <div className="border p-2 rounded-md bg-white flex items-center gap-2">
                        <Phone className="size-4 text-blue-500 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium text-muted-foreground">Contact</p>
                            <p className="text-xs font-semibold break-all">{user.phone || "—"}</p>
                        </div>
                    </div>
                    <div className="border p-2 rounded-md bg-white flex items-center gap-2">
                        <Mail className="size-4 text-blue-500 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium text-muted-foreground">Email</p>
                            <p className="text-xs font-semibold break-all">{user.email || "—"}</p>
                        </div>
                    </div>
                    <div className="border p-2 rounded-md bg-white flex items-center gap-2">
                        <Gift className="size-4 text-green-500 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium text-muted-foreground">Referral Code</p>
                            <p className="text-xs font-semibold break-all">{user.referralCode || "—"}</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* kyc details */}
            <div className="space-y-1.5">
                <h2 className="font-medium text-sm px-0.5">KYC Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {(() => {
                        const aadharKyc = user.kyc?.find((k) => k.type === "AADHARCARD")
                        const panKyc = user.kyc?.find((k) => k.type === "PANCARD")
                        return (
                            <>
                                <div className="border p-2 rounded-md bg-white flex items-center gap-2">
                                    <IdCardIcon className="size-4 text-green-500 shrink-0" />
                                    <span className="text-sm font-bold flex-1">Aadhaar Card</span>
                                    {aadharKyc?.imageUrl && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 shrink-0 shadow-none"
                                                onClick={() => window.open(aadharKyc.imageUrl!, "_blank")}
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 shrink-0 shadow-none"
                                                onClick={() => downloadImage(aadharKyc.imageUrl!, "aadhaar-card")}
                                            >
                                                <Download className="size-4" />
                                            </Button>
                                        </>

                                    )}
                                </div>
                                <div className="border p-2 rounded-md bg-white flex items-center gap-2">
                                    <IdCardIcon className="size-4 text-green-500 shrink-0" />
                                    <span className="text-sm font-bold flex-1">PAN Card</span>
                                    {panKyc?.imageUrl && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 shrink-0 shadow-none"
                                                onClick={() => window.open(panKyc.imageUrl!, "_blank")}
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 shrink-0 shadow-none"
                                                onClick={() => downloadImage(panKyc.imageUrl!, "pan-card")}
                                            >
                                                <Download className="size-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </>
                        )
                    })()}
                </div>
            </div>
            <div>
                <h1 className="font-medium py-4 px-2 text-xl">User Details</h1>
                <div className="grid grid-cols-4 gap-2">
                    <div className="border-2 p-2 px-3 rounded-md bg-white">
                        <div className="flex flex-col gap-1">
                            <Gem className="size-5 text-green-500" />
                            <p className="text-lg font-bold">{userStats.totalGems}</p>
                            <p className="text-[12px] font-medium">Gems in Wallet</p>
                        </div>
                    </div>
                    <div className="border-2 p-2 px-3 rounded-md bg-white">
                        <div className="flex flex-col gap-1">
                            <Building2 className="size-5 text-green-500" />
                            <p className="text-lg font-bold">{userStats.totalProperties}</p>
                            <p className="text-[12px] font-medium">Total Properties</p>
                        </div>
                    </div>
                    <div className="border-2 p-2 px-3 rounded-md bg-white">
                        <div className="flex flex-col gap-1">
                            <Handshake className="size-5 text-blue-500" />
                            <p className="text-lg font-bold">{userStats.soldToRealBro}</p>
                            <p className="text-[12px] font-medium">Sold to RealBro</p>
                        </div>
                    </div>
                    <div className="border-2 p-2 px-3 rounded-md bg-white">
                        <div className="flex flex-col gap-1">
                            <IndianRupee className="size-5 text-green-500" />
                            <p className="text-lg font-bold">{formatPrice(userStats.totalPropertiesWorth)}</p>
                            <p className="text-[12px] font-medium">Prop. Worth</p>
                        </div>
                    </div>
                </div>
                <UserSellingHistory
                    soldToRealBro={properties_by_status.soldToRealBro}
                    soldFromExclusive={properties_by_status.soldFromExclusive}
                />
            </div>

            <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Block User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to block {name}? They will no longer be able to access the platform.
                        </DialogDescription>
                    </DialogHeader>
                    {blockError && <p className="text-sm text-red-500">{blockError}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBlockOpen(false)} disabled={isBlocking}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleBlock} disabled={isBlocking}>
                            {isBlocking ? <Loader2 className="size-4 animate-spin" /> : null}
                            {isBlocking ? "Blocking..." : "Block"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={unblockOpen} onOpenChange={setUnblockOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Unblock User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to unblock {name}? They will be able to access the platform again.
                        </DialogDescription>
                    </DialogHeader>
                    {unblockError && <p className="text-sm text-red-500">{unblockError}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUnblockOpen(false)} disabled={isUnblocking}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleUnblock}
                            disabled={isUnblocking}
                        >
                            {isUnblocking ? <Loader2 className="size-4 animate-spin" /> : null}
                            {isUnblocking ? "Unblocking..." : "Unblock"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
