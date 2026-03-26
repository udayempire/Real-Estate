"use client"

import { useQuery } from "@tanstack/react-query"
import { Building2, FileTextIcon, Gem, Users2, WalletIcon } from "lucide-react"
import { api } from "@/lib/api"
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card"

type OverviewAnalytics = {
    activeListings: number
    totalUsers: number
    activeRequirements: number
    revenue: number
    payableGems: number
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-IN").format(value)
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value)
}

export const analyticsCards = (overview: OverviewAnalytics) => [
    {
        title: "Active Listings", // user listing + exclusive listing
        value: formatNumber(overview.activeListings),
        icon: Building2,
        color: "text-blue-500",
        iconBg: "bg-blue-100",
        borderGlow: "from-blue-500/20 to-cyan-400/20",
    },
    {
        title: "Total Users",
        value: formatNumber(overview.totalUsers),
        icon: Users2,
        color: "text-purple-500",
        iconBg: "bg-purple-100",
        borderGlow: "from-purple-500/20 to-fuchsia-400/20",
    },
    {
        title: "Active Requirements", // requriements with status active
        value: formatNumber(overview.activeRequirements),
        icon: FileTextIcon,
        color: "text-orange-500",
        iconBg: "bg-orange-100",
        borderGlow: "from-orange-500/20 to-amber-400/20",
    },
    {
        title: "Revenue", // total exclusive sold amount , properties with status sold then sum up their amount
        value: formatCurrency(overview.revenue),
        icon: WalletIcon,
        color: "text-green-500",
        iconBg: "bg-green-100",
        borderGlow: "from-green-500/20 to-emerald-400/20",
    },
    {
        title: "Paid Gems", // total gems paid to users 
        value: formatNumber(overview.payableGems),
        icon: Gem,
        color: "text-blue-400",
        iconBg: "bg-sky-100",
        borderGlow: "from-sky-500/20 to-blue-400/20",
    },
]

export const AnalyticsCards = () => {
    const { data, isError } = useQuery({
        queryKey: ["dashboard", "analytics-overview"],
        queryFn: async () => {
            const response = await api.get<{ success: boolean; data: OverviewAnalytics }>("/analytics/overview")
            return response.data.data
        },
        staleTime: 60 * 1000,
    })

    if (isError) {
        return <div className="rounded-lg border p-4 text-sm text-red-500">Failed to load analytics cards.</div>
    }

    const cards = analyticsCards(
        data ?? {
            activeListings: 0,
            totalUsers: 0,
            activeRequirements: 0,
            revenue: 0,
            payableGems: 0,
        }
    )

    return (
        <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {
                cards.map((card, index) => (
                    <Card
                        key={index}
                        className={`group relative overflow-hidden rounded-xl border border-white/60 bg-linear-to-b from-white to-zinc-50 p-0 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
                    >
                        <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r ${card.borderGlow}`} />
                        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-zinc-100/70 blur-2xl transition-transform duration-500 group-hover:scale-125" />

                        <CardHeader className="pb-1 pt-3">
                            <CardTitle className="flex items-center justify-between gap-2">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconBg}`}>
                                    <card.icon className={`size-5 ${card.color}`} strokeWidth={1.8} />
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3 pt-0">
                            <h1 className="truncate text-2xl font-bold leading-none text-zinc-900">{card.value}</h1>
                            <p className="mt-1 text-sm font-medium text-zinc-500">{card.title}</p>
                        </CardContent>
                    </Card>
                ))
            }
        </div>
    )
}