import { QRCodeSVG } from "qrcode.react";
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "../ui/button";

interface Setup2FAProps {
    qrCodeUrl: string;
    otpCode: string;
    onOtpChange: (value: string) => void;
    error: string | null;
    onVerify: () => void;
    isPending: boolean;
}
export const Setup2FA = ({ qrCodeUrl, otpCode, onOtpChange,error, onVerify, isPending }: Setup2FAProps) => {
    return (
        <div className="flex items-center justify-center">
        <div className="w-full max-w-md text-center">
            <h1 className="text-[24px] font-semibold mb-2">Secure Your Account</h1>
            <p className="text-gray-500 mb-6 text-sm">
                Scan the QR code with Google Authenticator to enable 2FA.
            </p>
            <div className="flex justify-center mb-6 bg-white p-4 rounded-lg">
                {qrCodeUrl && <QRCodeSVG value={qrCodeUrl} size={100} />}
            </div>

            <div className="flex justify-center mb-6">
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

            {/* Show error from mutation */}
            {error && (
                <p className="text-red-500 text-sm mb-4">
                    {error}
                </p>
            )}

            <Button
                className="w-full rounded-3xl py-6 text-[16px]"
                onClick={onVerify}
                disabled={isPending || otpCode.length < 6}
            >
                {isPending ? "Verifying..." : "Verify & Enable 2FA"}
            </Button>
        </div>
    </div>
    );
};