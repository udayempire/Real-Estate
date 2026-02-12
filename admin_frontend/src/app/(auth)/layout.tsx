import { AuthBanner } from "@/components/auth/authLeftBanner";
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid h-svh overflow-hidden md:grid-cols-2">
            <div className="hidden md:block">
                <AuthBanner />
            </div>
            {children}
        </div>
    );
}