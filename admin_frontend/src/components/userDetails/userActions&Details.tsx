import { Building2, Gem, Handshake, IndianRupee, Mail, PenLine, PhoneCallIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { OctagonMinus, BadgeCheck } from "lucide-react";
import { UserSellingHistory } from "./userSellingHistory";
import type { FullUserData } from "./types";
import { useRouter } from "next/navigation";

function formatPrice(value: number): string {
    if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `₹ ${(value / 100000).toFixed(1)} Lakh`;
    if (value >= 1000) return `₹ ${(value / 1000).toFixed(1)}K`;
    return `₹ ${value}`;
}

export function UserActionsAndDetails({ user }: { user: FullUserData }) {
    const router = useRouter();
    const { userStats, properties_by_status } = user;
    const name = `${user.firstName} ${user.lastName}`;
    const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

    return (
        <div className="flex flex-col gap-4 mt-4">
            <div className="flex gap-4 w-full justify-start">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar ?? ""} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                    <div className="font-bold text-xl">
                        {name}
                    </div>
                    {user.isEmailVerified && (
                        <BadgeCheck className="size-8 fill-blue-500 text-white" />
                    )}
                </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
                <Button variant="outline" className="gap-2 h-12 w-32 border-red-200 hover:bg-red-50 hover:text-red-600 shadow-none">
                    <OctagonMinus className="size-5 text-orange-500" />
                    Block User
                </Button>
                <Button variant="outline" className="gap-2 h-12 w-32 border-red-200 hover:bg-red-50 hover:text-red-600 shadow-none">
                    <Gem className="size-5 text-green-500" />
                    <p>Send Gems</p>
                </Button>
                <Button variant="outline" className="gap-2 h-12 w-32 border-red-200 hover:bg-red-50 hover:text-red-600 shadow-none"
                onClick={() => router.push(`/user/edit/${user.id}`)}
                >
                    <PenLine className="size-5 text-blue-500" />
                    <p>Edit User</p>
                </Button>
                <Button variant="default" className="bg-green-500 hover:bg h-11 w-12 hover:bg-green-600">
                    <PhoneCallIcon className="size-5" />
                </Button>
                <Button variant="default" className="bg-blue-500 hover:bg h-11 w-12">
                    <Mail className="size-5" />
                </Button>
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
        </div>
    )
}
