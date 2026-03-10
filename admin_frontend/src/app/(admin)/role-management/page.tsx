 "use client";

import { getColumns } from "@/components/role_management/columns";
import { DataTable } from "@/components/role_management/data-table";
import { type RoleManagement as RoleManagementRow } from "@/components/role_management/columns";
import { api } from "@/lib/api";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";

type StaffApiItem = {
    id: string;
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
        id: staff.id,
        username: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
        role: formatRole(staff.role),
        isActive: staff.isActive !== false,
        blockDate: staff.blockDate ?? (staff.isActive === false ? "Blocked" : "-"),
    }));
}

async function blockStaffApi(id: string) {
    const response = await api.put(`/staff/management/block-staff/${id}`);
    return response.data;
}

async function unblockStaffApi(id: string) {
    const response = await api.put(`/staff/management/unblock-staff/${id}`);
    return response.data;
}

async function deleteStaffApi(id: string) {
    const response = await api.delete(`/staff/management/delete-staff/${id}`);
    return response.data;
}

export default function Page() {
    const queryClient = useQueryClient();
    const [blockTarget, setBlockTarget] = useState<RoleManagementRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<RoleManagementRow | null>(null);

    const { data = [], isLoading } = useQuery({
        queryKey: ["staffs"],
        queryFn: getRoleManagement,
    });

    const blockMutation = useMutation({
        mutationFn: (staff: RoleManagementRow) =>
            staff.isActive ? blockStaffApi(staff.id) : unblockStaffApi(staff.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staffs"] });
            setBlockTarget(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteStaffApi(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["staffs"] });
            setDeleteTarget(null);
        },
    });

    const columns = useMemo(
        () =>
            getColumns({
                onBlock: (staff) => setBlockTarget(staff),
                onDelete: (staff) => setDeleteTarget(staff),
            }),
        []
    );

    return (
        <div>
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <DataTable columns={columns} data={data} />
            )}

            {/* Block / Unblock confirmation dialog */}
            <Dialog open={!!blockTarget} onOpenChange={(open) => !open && setBlockTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {blockTarget?.isActive ? "Block Staff" : "Unblock Staff"}
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to {blockTarget?.isActive ? "block" : "unblock"}{" "}
                            <span className="font-semibold">{blockTarget?.username}</span>?
                            {blockTarget?.isActive
                                ? " They will no longer be able to access the admin panel."
                                : " They will regain access to the admin panel."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            className={
                                blockTarget?.isActive
                                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                                    : "bg-green-500 hover:bg-green-600 text-white"
                            }
                            onClick={() => blockTarget && blockMutation.mutate(blockTarget)}
                            disabled={blockMutation.isPending}
                        >
                            {blockMutation.isPending
                                ? "Processing..."
                                : blockTarget?.isActive
                                    ? "Yes, Block"
                                    : "Yes, Unblock"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Staff</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to permanently delete{" "}
                            <span className="font-semibold">{deleteTarget?.username}</span>? This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}