"use client";

import { useEffect, useState } from "react";
import { CalendarClockIcon, CalendarCheck2, CalendarSyncIcon, PencilLine, Building2, Gem } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { SendGemsDialog } from "../shared/sendGemsDialog";
import { RedeemGemsDialog } from "../shared/redeemGemsDialog";
import { api } from "@/lib/api";

type GemStats = {
    totalGemRedemptionValue: number;
    totalGemsAllocated: number;
    totalReferralReward: number;
    totalAcquisitionReward: number;
    totalExclusiveSaleReward: number;
};

function formatNumber(n: number) {
    return n.toLocaleString();
}

export default function TopBar() {
    const [stats, setStats] = useState<GemStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchStats = async () => {
            try {
                const { data } = await api.get<{ success: boolean; data: GemStats }>("/staff/gems/stats");
                if (isMounted) setStats(data.data);
            } catch {
                if (isMounted) setStats(null);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchStats();
        return () => { isMounted = false; };
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center">
                <h1 className="font-medium text-xl">Financials</h1>
                <div className="flex gap-2">
                    <SendGemsDialog
                        trigger={
                            <Button>
                                <PencilLine />
                                Send Gems to User
                            </Button>
                        }
                    />
                    <RedeemGemsDialog
                        trigger={
                            <Button variant="outline">
                                <PencilLine />
                                Add New Payout
                            </Button>
                        }
                    />


                </div>
            </div>
            <div className="grid grid-cols-5 gap-3 mt-3">
                <Card className="border py-3 gap-1">
                    <CardHeader className="px-4 py-0 font-extralight">
                        <CardTitle className="flex justify-between items-center gap-2">
                            <Building2 className="size-7 font-extralight text-blue-500" strokeWidth={1.5} />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                        <h1 className="font-bold text-2xl">
                            {isLoading ? "..." : formatNumber(stats?.totalGemRedemptionValue ?? 0)}
                        </h1>
                        <p className="text-gray-500 font-medium text-[12px]">Total Gem Redemption Value</p>
                    </CardContent>
                </Card>
                <Card className="border py-3 gap-1">
                    <CardHeader className="px-4 py-0 font-extralight">
                        <CardTitle className="flex justify-between items-center gap-2">
                            <Gem className="size-7 font-extralight text-green-300" strokeWidth={1.5} />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                        <h1 className="font-bold text-2xl">
                            {isLoading ? "..." : formatNumber(stats?.totalGemsAllocated ?? 0)}
                        </h1>
                        <p className="text-gray-500 font-medium text-[12px]">Total worth of Gems Allocated</p>
                    </CardContent>
                </Card>
                <Card className="col-span-3 border py-3 gap-2">
                    <CardHeader className="px-4 py-0">
                        <CardTitle className="flex justify-between items-center">
                            <h1 className="font-medium text-base">Insights</h1>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                        <div className="grid grid-cols-3 gap-3 ml-16">
                            <div className="flex items-center gap-2">
                                <CalendarClockIcon size={20} className="text-blue-500" strokeWidth={1.5} />
                                <div>
                                    <h1 className="text-[15px] font-bold">
                                        {isLoading ? "..." : formatNumber(stats?.totalReferralReward ?? 0)}
                                    </h1>
                                    <p className="text-[12px] text-gray-500 font-medium">Total Referral reward</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarCheck2 size={20} className="text-green-500" strokeWidth={1.5} />
                                <div>
                                    <h1 className="text-[15px] font-bold">
                                        {isLoading ? "..." : formatNumber(stats?.totalAcquisitionReward ?? 0)}
                                    </h1>
                                    <p className="text-[12px] text-gray-500 font-medium">Total acquisition reward</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarSyncIcon size={20} className="text-red-500" strokeWidth={1.5} />
                                <div>
                                    <h1 className="text-[15px] font-bold text-green-500">
                                        {isLoading ? "..." : formatNumber(stats?.totalExclusiveSaleReward ?? 0)}
                                    </h1>
                                    <p className="text-[12px] text-gray-500 font-medium">Total exclusive sale reward</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
