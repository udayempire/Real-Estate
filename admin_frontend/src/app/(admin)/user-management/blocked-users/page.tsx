"use client"

import { useCallback, useState, useEffect } from "react"
import { BlockedUsersDataTable } from "@/components/user_management/blockedUsersDataTable"
import { getBlockedUsersColumns, type BlockedUserColumnInterface } from "@/components/user_management/blockedUsersColumns"
import { api } from "@/lib/api"

type BlockedUserApiItem = {
    id: string
    firstName: string
    lastName: string
    email: string
    blockedOn: string | null
    points?: number
    blueTick?: boolean
    isVerifiedSeller?: boolean
}

async function getBlockedUsers(): Promise<BlockedUserColumnInterface[]> {
    const response = await api.get("/staff/users/blocked")
    const users: BlockedUserApiItem[] = response.data?.users ?? []
    return users.map((u) => ({
        id: u.id,
        username: `${u.firstName} ${u.lastName}`,
        email: u.email,
        blockedOn: u.blockedOn
            ? new Date(u.blockedOn).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—",
        blockedOnRaw: u.blockedOn ?? null,
        gems: u.points ?? 0,
        isVerifiedSeller: u.isVerifiedSeller ?? false,
        isBlueTick: u.blueTick ?? false,
    }))
}

export default function BlockedUsersPage() {
    const [data, setData] = useState<BlockedUserColumnInterface[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const refetch = useCallback(async () => {
        try {
            const rows = await getBlockedUsers()
            setData(rows)
        } catch (error) {
            console.error("getBlockedUsers error:", error)
            setData([])
        }
    }, [])

    useEffect(() => {
        const load = async () => {
            setIsLoading(true)
            try {
                await refetch()
            } finally {
                setIsLoading(false)
            }
        }
        void load()
    }, [refetch])

    return (
        <div>
            {isLoading ? (
                <div className="p-4">Loading...</div>
            ) : (
                <BlockedUsersDataTable columns={getBlockedUsersColumns({ onUserUnblocked: refetch, onUserDeleted: refetch })} data={data} />
            )}
        </div>
    )
}
 