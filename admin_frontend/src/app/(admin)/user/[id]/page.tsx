"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { FullUserDetails } from "@/components/userDetails/fullUser"
import type { FullUserData } from "@/components/userDetails/types"

export default function UserPage() {
    const params = useParams<{ id: string }>()
    const userId = Array.isArray(params?.id) ? params.id[0] : params?.id
    const [user, setUser] = useState<FullUserData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!userId) return
        const fetchUser = async () => {
            try {
                setIsLoading(true)
                const res = await api.get(`/staff/users/${userId}`)
                setUser(res.data.user)
            } catch (err) {
                console.error("Failed to fetch user details:", err)
                setError("Failed to load user details")
            } finally {
                setIsLoading(false)
            }
        }
        void fetchUser()
    }, [userId])

    if (isLoading) {
        return <div className="p-4 text-center text-muted-foreground">Loading user details...</div>
    }

    if (error || !user) {
        return <div className="p-4 text-center text-red-500">{error ?? "User not found"}</div>
    }

    return (
        <div className="p-4">
            <FullUserDetails user={user} />
        </div>
    )
}
