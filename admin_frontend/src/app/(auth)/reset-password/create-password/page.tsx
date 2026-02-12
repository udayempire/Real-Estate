import { AdminLoginPanel } from "@/components/auth/adminLoginPanel";
import { CreatePasswordCard } from "@/components/auth/createPasswordCard";

export default function CreatePasswordPage() {
  return (
    <AdminLoginPanel>
      <CreatePasswordCard />
    </AdminLoginPanel>
  );
}
