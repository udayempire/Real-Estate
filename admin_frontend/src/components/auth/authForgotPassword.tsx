"use client"
import Link from "next/link";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";

export const AuthForgotPassword = () => {
    const router = useRouter();
    return (
        <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
                <h1 className="text-center text-[24px] font-semibold">
                    Forgot Password
                </h1>
                <div className="flex flex-col gap-4 mt-12">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5  text-blue-500" />
                        <Input
                            type="email"
                            placeholder="Enter Email / number"
                            className="pl-10 py-6"
                        />
                    </div>
                    <Button className="rounded-3xl mt-16 py-6 text-[16px]" onClick={() => router.push("/reset-password/verification")}>
                        Send Code
                    </Button>
                </div>
                {/* Reset password link */}
                <div className="text-center text-[15px] font-bold mt-4 text-blue-600">
                    <Link href="/signin">
                        Login with Password
                    </Link>
                </div>
            </div>
        </div>
    );
};