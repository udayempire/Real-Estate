"use client"
import Link from "next/link";
import { Button } from "../ui/button";
import { RotateCcw } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { useRouter } from "next/navigation";

export const VerificationCard = () => {
    const router = useRouter();
    return (
        <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
                <h1 className="text-center text-[24px] font-semibold">
                    Code Sent
                </h1>
                <div className="flex flex-col gap-4 mt-12">
                    <div className="flex justify-center">
                        <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS}>
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>
                    {/* Password with icon */}
                    <div className="relative">
                        <Button className="bg-white text-blue-500 text-md text-center w-full">
                            <RotateCcw className="w-5 h-5" />
                            Resend OTP
                        </Button>
                    </div>
                    <Button className="rounded-3xl py-6 text-[16px]" onClick={() => router.push("/reset-password/create-password")}>
                        Verify
                    </Button>
                </div>
                {/* Reset password link */}
                <div className="text-center text-[15px] font-bold mt-4 text-blue-600">
                    <Link href="/signin">
                        Login with password
                    </Link>
                </div>
            </div>
        </div>
    );
};
