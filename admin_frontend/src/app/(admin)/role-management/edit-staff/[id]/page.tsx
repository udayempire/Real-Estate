import { EditStaff } from "@/components/role_management/editStaff";

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div>
            <EditStaff staffId={id}/>
        </div>
    )
};