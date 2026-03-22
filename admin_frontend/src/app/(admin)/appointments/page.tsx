"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { createAppointmentColumns } from "@/components/appointments/appointmentColumns"
import type { AppointmentTableInterface } from "@/components/appointments/appointmentColumns"
import { AppointmentsDataTable } from "@/components/appointments/appointmentDataTable"
import AppointmentsTopBar from "@/components/appointments/appointmentsTopBar"
import { fetchAppointments } from "@/actions/appointments"
import type { AppointmentApi } from "@/actions/appointments"
import type { AppointmentStatusFilter } from "@/components/appointments/filterAppointments"
import type { DateFilterParams } from "@/components/appointments/filterTimelineButton"
import { Loader2 } from "lucide-react"

function formatTimeToAmPm(timeStr: string): string {
    if (!timeStr) return "—"
    const upper = timeStr.toUpperCase()
    if (upper.includes("AM") || upper.includes("PM")) return timeStr
    const parts = timeStr.split(/[:\s]/)
    const h = parseInt(parts[0], 10)
    const m = parts[1] ? parseInt(parts[1], 10) : 0
    if (isNaN(h)) return timeStr
    const period = h >= 12 ? "PM" : "AM"
    const hour12 = h % 12 || 12
    const min = isNaN(m) ? "00" : String(m).padStart(2, "0")
    return `${hour12}:${min} ${period}`
}

function formatDateDdMmYy(dateStr: string): string {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "—"
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = String(d.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
}

const statusDisplayMap: Record<string, string> = {
    SCHEDULED: "Scheduled",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    WAITING: "Waiting",
}

function mapAppointmentToRow(a: AppointmentApi): AppointmentTableInterface {
    const staffHandlerDisplay = !a.staffHandler
        ? "--"
        : a.staffHandler.role === "SUPER_ADMIN"
          ? "Super Admin"
          : `${a.staffHandler.firstName} ${a.staffHandler.lastName}`.trim() || "--"

    const d = new Date(a.appointmentDate)
    const dateIso = isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10)
    return {
        id: a.id,
        userId: a.userId,
        propertyId: a.propertyId,
        userName: `${a.user.firstName} ${a.user.lastName}`.trim() || "—",
        purpose: a.property.title,
        staffHandler: staffHandlerDisplay,
        dateStr: formatDateDdMmYy(a.appointmentDate),
        dateIso,
        timeStr: formatTimeToAmPm(a.appointmentTime),
        isPreBooked: a.isPreBooked,
        status: statusDisplayMap[a.status] ?? a.status,
        notes: a.notes ?? null,
        canAcceptReject: a.status === "SCHEDULED",
        canMarkCompleted: a.status === "WAITING",
    }
}

function filterByDate(
    rows: AppointmentTableInterface[],
    params: DateFilterParams | null
): AppointmentTableInterface[] {
    if (!params) return rows
    if (params.date) {
        return rows.filter((r) => r.dateIso === params.date)
    }
    if (params.startDate && params.endDate) {
        return rows.filter(
            (r) => r.dateIso >= params.startDate! && r.dateIso <= params.endDate!
        )
    }
    return rows
}

export default function AppointmentsPage() {
    const [data, setData] = useState<AppointmentTableInterface[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<AppointmentStatusFilter>("ALL")
    const [dateFilter, setDateFilter] = useState<DateFilterParams | null>(null)

    const fetchData = useCallback(async (silent = false) => {
        try {
            if (!silent) setIsLoading(true)
            setError(null)
            const statusParam = statusFilter === "ALL" ? undefined : statusFilter
            const appointments = await fetchAppointments(statusParam)
            setData(appointments.map(mapAppointmentToRow))
        } catch (err) {
            console.error("Failed to fetch appointments:", err)
            setError("Failed to load appointments")
        } finally {
            setIsLoading(false)
        }
    }, [statusFilter])

    const refetch = useCallback(() => {
        fetchData(true)
    }, [fetchData])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const filteredData = useMemo(
        () => filterByDate(data, dateFilter),
        [data, dateFilter]
    )

    const analytics = useMemo(() => {
        const todayIso = new Date().toISOString().slice(0, 10)
        const isToday = (row: AppointmentTableInterface) => row.dateIso === todayIso

        return {
            totalScheduled: data.length,
            totalPendingApprovals: data.filter((row) => row.status === "Scheduled").length,
            scheduledToday: data.filter((row) => row.status === "Scheduled" && isToday(row)).length,
            completedToday: data.filter((row) => row.status === "Completed" && isToday(row)).length,
            waitingToday: data.filter((row) => row.status === "Waiting" && isToday(row)).length,
        }
    }, [data])

    return (
        <div className="mt-4">
            <AppointmentsTopBar
                totalScheduled={analytics.totalScheduled}
                totalPendingApprovals={analytics.totalPendingApprovals}
                scheduledToday={analytics.scheduledToday}
                completedToday={analytics.completedToday}
                waitingToday={analytics.waitingToday}
            />
            {isLoading && (
                <div className="flex items-center gap-2 px-4 py-4 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                    <span>Loading appointments…</span>
                </div>
            )}
            {error && (
                <p className="text-sm text-red-500 px-4 py-4">{error}</p>
            )}
            {!isLoading && !error && (
                <AppointmentsDataTable
                    columns={createAppointmentColumns(refetch)}
                    data={filteredData}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    dateFilter={dateFilter}
                    onDateFilterChange={setDateFilter}
                />
            )}
        </div>
    )
}
