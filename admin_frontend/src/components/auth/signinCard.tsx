"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios"; // Import axios
import { Setup2FA } from "./setup2FA";
import { Verify2FA } from "./verify2FA";

type AuthStep = "LOGIN" | "SETUP_2FA" | "VERIFY_2FA";

// Define the response types for better type safety
interface LoginResponse {
    requireSetup: boolean;
    require2fa: boolean;
    otpauth_url?: string; // Only present if requireSetup is true
    tempToken?: string;   // Likely needed for the next step to identify the session
}

export const SigninCard = () => {
    const router = useRouter();
    const [step, setStep] = useState<AuthStep>("LOGIN");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [qrCodeUrl, setQrCodeUrl] = useState("otpauth://totp/RealBros:admin@test.com?secret=JBSWY3DPEHPK3PXP&issuer=RealBros");
    // use useState("") as this is for development purposes and replace by unique_url comes from backend

    const getErrorMessage = (error: unknown) => {
        if (error instanceof AxiosError) {
            return error.response?.data?.message || error.message || "An error occurred";
        }
        return "An unexpected error occurred";
    };

    //Mutation for Login
    const loginMutation = useMutation({
        mutationFn: async () => {
            // Adjust the URL to match actual backend api endpoint
            const response = await axios.post<LoginResponse>('/api/auth/login', {
                email,
                password
            });
            return response.data;
        },
        onSuccess: (data) => {
            if (data.requireSetup && data.otpauth_url) {
                setQrCodeUrl(data.otpauth_url);
                setStep("SETUP_2FA");
            } else if (data.require2fa) {
                setStep("VERIFY_2FA");
            } else {
                router.push("/dashboard");
            }
        },
        onError: (error) => {
            console.error(error);
        }
    });

    // Mutation for Verify OTP
    const verifyOtpMutation = useMutation({
        mutationFn: async () => {
            // Determine which endpoint to hit based on the current step
            const endpoint = step === "SETUP_2FA"
                ? '/api/auth/2fa/setup/verify'
                : '/api/auth/2fa/verify';

            // need to send the email or a temp token along with the code
            const response = await axios.post(endpoint, {
                email,
                token: otpCode
            });
            return response.data;
        },
        onSuccess: () => {
            router.push("/dashboard");
        }
    });

    if (step === "SETUP_2FA") {
        return (
            <Setup2FA
                qrCodeUrl={qrCodeUrl}
                otpCode={otpCode}
                onOtpChange={setOtpCode}
                onVerify={() => verifyOtpMutation.mutate()}
                isPending={verifyOtpMutation.isPending}
                error={verifyOtpMutation.isError ? getErrorMessage(verifyOtpMutation.error) : null}
            />
        );
    }
    if (step === "VERIFY_2FA") {
        return (
            <Verify2FA
                otpCode={otpCode}
                onOtpChange={setOtpCode}
                onVerify={() => verifyOtpMutation.mutate()}
                onBack={() => setStep("LOGIN")}
                isPending={verifyOtpMutation.isPending}
                error={verifyOtpMutation.isError ? getErrorMessage(verifyOtpMutation.error) : null}
            />
        );
    }

    // default login
    return (
        <LoginForm
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={() => loginMutation.mutate()}
            isPending={loginMutation.isPending}
            error={loginMutation.error ? getErrorMessage(loginMutation.error) : null}
        />
    );
};