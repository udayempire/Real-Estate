import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";

interface Verify2FAProps {
    otpCode: string;
    onOtpChange: (value: string) => void;
    onVerify: () => void;
    onBack: () => void;
    isPending: boolean;
    error: string | null;
}
export const Verify2FA = ({ otpCode, onOtpChange, onVerify, onBack, isPending, error }: Verify2FAProps) => {
    return (
        <div className="flex items-center justify-center">
        <div className="w-full max-w-md text-center">
            <h1 className="text-[24px] font-semibold mb-2">Two-Factor Authentication</h1>
            <p className="text-gray-500 mb-8 text-sm">
                Enter the 6-digit code from your authenticator app.
            </p>

            <div className="flex justify-center mb-8">
                <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={onOtpChange}
                    pattern={REGEXP_ONLY_DIGITS}
                >
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

            {error && (
                <p className="text-red-500 text-sm mb-4">
                    {error}
                </p>
            )}

            <Button
                className="w-full rounded-3xl py-6 text-[16px]"
                onClick={() => onVerify()}
                disabled={isPending || otpCode.length < 6}
            >
                {isPending ? "Verifying..." : "Verify Login"}
            </Button>

            <button
                onClick={() => onBack()}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 mx-auto"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
        </div>
    </div>
    );
};