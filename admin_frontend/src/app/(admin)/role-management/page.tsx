 "use client";

import { columns } from "@/components/role_management/columns";
import { DataTable } from "@/components/role_management/data-table";
import { type RoleManagement as RoleManagementRow } from "@/components/role_management/columns";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

type StaffApiItem = {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive?: boolean;
    blockDate?: string | null;
};

const formatRole = (role: string) => {
    return role
        .toLowerCase()
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

async function getRoleManagement(): Promise<RoleManagementRow[]> {
    const response = await api.get("/staff/management/get-staffs");
    const staffs: StaffApiItem[] = response.data?.staffs ?? [];

    return staffs.map((staff) => ({
        username: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
        role: formatRole(staff.role),
        blockDate: staff.blockDate ?? (staff.isActive === false ? "Blocked" : "-"),
    }));
}

export default function Page() {
    const [data, setData] = useState<RoleManagementRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const rows = await getRoleManagement();
                setData(rows);
            } catch (error) {
                console.error("getRoleManagement error:", error);
                setData([]);
            } finally {
                setIsLoading(false);
            }
        };

        void load();
    }, []);

    return (
        <div>
            {isLoading ? <div>Loading...</div> : <DataTable columns={columns} data={data} />}
        </div>
    )
}