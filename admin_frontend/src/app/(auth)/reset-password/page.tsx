import { AdminLoginPanel } from "@/components/auth/adminLoginPanel";
import { AuthForgotPassword } from "@/components/auth/authForgotPassword";

export default function ResetPasswordPage() {
  return (
    <AdminLoginPanel>
      <AuthForgotPassword />
    </AdminLoginPanel>
  );
}
