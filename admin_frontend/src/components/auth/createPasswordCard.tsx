"use client"
import Link from "next/link";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { LockKeyholeOpen } from "lucide-react";
import { useRouter } from "next/navigation";

export const CreatePasswordCard = () => {
    const router = useRouter();
    return (
        <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
                <h1 className="text-center text-[24px] font-semibold">
                    Sign In
                </h1>
                <div className="flex flex-col gap-4 mt-12">
                    <div className="relative">
                        <LockKeyholeOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5  text-blue-500" />
                        <Input
                            type="password"
                            placeholder="Enter password"
                            className="pl-10 py-6"
                        />
                    </div>
                    {/* Password with icon */}
                    <div className="relative">
                        <LockKeyholeOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5  text-blue-500" />
                        <Input
                            type="password"
                            placeholder="Re-enter your password"
                            className="pl-10 py-6"
                        />
                    </div>
                    <Button className="rounded-3xl py-6 text-[16px]" onClick={() => router.push("/signin")}>
                        Save Password
                    </Button>
                </div>
                {/* Reset password link */}
                <div className="text-center text-[15px] font-bold mt-4 text-blue-600">
                    <Link href="/reset-password">
                        Reset your password
                    </Link>
                </div>
            </div>
        </div>
    );
};
