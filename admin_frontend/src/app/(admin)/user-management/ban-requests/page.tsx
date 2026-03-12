"use client"

import { useCallback, useEffect, useState } from "react"
import { createBanRequestColumns } from "@/components/user_management/requestBansColumns"
import { RequestBansDataTable } from "@/components/user_management/requestBansDataTable"
import type { BanRequestRow } from "@/components/user_management/requestBansColumns"
import { KYCStatus } from "@/components/user_management/allUsersColumns"
import { api } from "@/lib/api"

type KycItem = { type: string; status: string }
type PropertyItem = { id: string; status: string }

type BanRequestApiItem = {
    id: string
    status: string
    createdAt: string
    user: {
        id: string
        firstName: string
        lastName: string
        email: string
        points: number
        kyc: KycItem[]
        properties: PropertyItem[]
        blueTick: boolean
        isVerifiedSeller: boolean
    }
    banReqByStaff: {
        firstName: string
        lastName: string
    }
}

function computePropertyStats(properties: PropertyItem[]) {
    const soldStatuses = ["SOLDOFFLINE", "SOLDTOREALBRO", "SOLDFROMLISTINGS"]
    const total = properties.length
    const active = properties.filter((p) => p.status === "ACTIVE").length
    const unlisted = properties.filter((p) => p.status === "UNLISTED").length
    const sold = properties.filter((p) => soldStatuses.includes(p.status)).length
    return { total, sold, active, unlisted }
}

const statusMap: Record<string, "Pending" | "Approved" | "Rejected"> = {
    PENDING_SUPERADMIN: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
}

export default function BanRequestsPage() {
    const [data, setData] = useState<BanRequestRow[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchBanRequests = useCallback(async (silent = false) => {
        try {
            if (!silent) setIsLoading(true)
            setError(null)
            const response = await api.get<{ success: boolean; data: BanRequestApiItem[] }>(
                "/staff/users/ban-requests"
            )
            const mapped: BanRequestRow[] = (response.data.data ?? []).map((r) => {
                const hasAnyVerifiedKyc = r.user.kyc?.some((k) => k.status === "VERIFIED") ?? false
                const name = `${r.user.firstName} ${r.user.lastName}`.trim() || "—"
                return {
                    id: r.id,
                    userId: r.user.id,
                    username: name,
                    email: r.user.email,
                    gems: r.user.points ?? 0,
                    kycStatus: hasAnyVerifiedKyc ? KYCStatus.Verified : KYCStatus.Pending,
                    isBlueTick: r.user.blueTick,
                    isVerifiedSeller: r.user.isVerifiedSeller,
                    propertyListings: computePropertyStats(r.user.properties ?? []),
                    requestedByStaff: `${r.banReqByStaff.firstName} ${r.banReqByStaff.lastName}`.trim() || "—",
                    status: statusMap[r.status] ?? "Pending",
                    createdAt: new Date(r.createdAt).toLocaleString(),
                }
            })
            setData(mapped)
        } catch (err) {
            console.error("Failed to fetch ban requests:", err)
            setError("Failed to load ban requests")
        } finally {
            if (!silent) setIsLoading(false)
        }
    }, [])

    const refetch = useCallback(() => {
        fetchBanRequests(true)
    }, [fetchBanRequests])

    useEffect(() => {
        fetchBanRequests()
    }, [fetchBanRequests])

    return (
        <div className="mt-4">
            {isLoading && (
                <p className="text-sm text-gray-500 px-4 mt-4">Loading ban requests...</p>
            )}
            {error && (
                <p className="text-sm text-red-500 px-4 mt-4">{error}</p>
            )}
            {!isLoading && !error && (
                <RequestBansDataTable
                    columns={createBanRequestColumns(refetch)}
                    data={data}
                />
            )}
        </div>
    )
}
