import { api } from "@/lib/api";

export type AppointmentApi = {
    id: string;
    userId: string;
    propertyId: string;
    appointmentDate: string;
    appointmentTime: string;
    status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "WAITING";
    notes: string | null;
    isPreBooked: boolean;
    property: { id: string; title: string };
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    staffHandler: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
    } | null;
};

export type AppointmentsResponse = {
    appointments: AppointmentApi[];
};

export async function fetchAppointments(status?: string): Promise<AppointmentApi[]> {
    const params = status ? { status } : {};
    const { data } = await api.get<AppointmentsResponse>("/staff/appointments", { params });
    return data.appointments ?? [];
}

export async function acceptAppointment(id: string): Promise<void> {
    await api.put(`/staff/appointments/${id}/accept`);
}

export async function rejectAppointment(id: string): Promise<void> {
    await api.put(`/staff/appointments/${id}/reject`);
}
