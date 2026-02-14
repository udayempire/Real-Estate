import { prisma } from "../../config/prisma";
import { hashPassword, comparePassword } from "../../utils/password";
import { signAccessToken, signRefreshToken } from "../../utils/jwt";
import { Request, Response } from "express";
import { generateReferralCode } from "../../utils/generateReferralCode";
import { verifyRefreshToken } from "../../utils/jwt";
import { createOtp, generateOtpCode, sendOtpEmail, verifyOtp, verifyOtp as verifyOtpService } from "../../services/otp.service";
import { OtpType } from "@prisma/client";

//check status codes at last
export async function signup(req: Request, res: Response) {
    function capitalizeFirstLetter(str: string): string {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    try {
        const {
            firstName, lastName, email, phone, password, age, gender, referrerId,
            aadharNo, kycAadharImageUrl, kycAadharImageKey,
            panNo, kycPanImageUrl, kycPanImageKey
        } = req.body;
        if (!req.body) {
            return res.status(404).json("Please fill all the details")
        }
        //check if referral code is provided
        let referrer = null;
        if (referrerId) {
            referrer = await prisma.user.findUnique({
                where: { referralCode: referrerId }
            });
            if (!referrer) {
                return res.status(400).json({
                    error: "Invalid referrer Id. Please use a valid referrer ID",
                    field: "referrerId"
                });
            }
        }
        let userReferralCode = generateReferralCode(firstName);
        // create user
        const user = await prisma.user.create({
            data: {
                firstName: capitalizeFirstLetter(firstName),
                lastName: capitalizeFirstLetter(lastName),
                email,
                phone,
                password: await hashPassword(password),
                age,
                gender,
                referralCode: userReferralCode,
                referrerId: referrer?.id,
                kyc: {
                    create: [
                        {
                            type: "AADHARCARD",
                            docNo: aadharNo,
                            imageUrl: kycAadharImageUrl,
                            imageKey: kycAadharImageKey,
                            status: "PENDING",
                        },
                        {
                            type: "PANCARD",
                            docNo: panNo,
                            imageUrl: kycPanImageUrl,
                            imageKey: kycPanImageKey,
                            status: "PENDING",
                        }
                    ]
                }
            }
        })
        //write logic to award points to one to referrers after clarification from team.
        const accessToken = signAccessToken({ id: user.id, role: "user" });
        const refreshToken = signRefreshToken({ id: user.id, role: "user" });
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }
        });
        return res.json({ accessToken, refreshToken, user })
    } catch (error: any) {
        console.error("Signup error:", error);
        
        // Handle Prisma unique constraint violations
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0];
            if (field === 'email') {
                return res.status(400).json({
                    error: "Email already registered",
                    field: "email"
                });
            }
            // Note: Phone is no longer unique, so this won't trigger for phone
            return res.status(400).json({
                error: "This information is already registered",
                field: field
            });
        }
        
        return res.status(500).json({ error: "Internal server error" });
    }
}
// save refreshToken in localstoragen or session
export async function signin(req: Request, res: Response) {
    try {
        const { email, password } = req.body;
        if (!req.body) {
            return res.status(400).json("Please fill valid email to proceed")
        }
        const user = await prisma.user.findUnique({
            where: { email }
        })
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" })
        }
        //check password
        const isValid = await comparePassword(password,user.password);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const accessToken = signAccessToken({ id: user.id, role: "user" });
        const refreshToken = signRefreshToken({ id: user.id, role: "user" })
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }
        });
        return res.json({ accessToken, refreshToken, user })

    } catch (error) {
        return res.status(500).json(error);
    }
}
// uses referesh Token so that only that device is signed out not all(if used userId to take refreshToken of all)
export async function signout(req: Request, res: Response) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ error: "Refresh Token not found" });
        }
        await prisma.refreshToken.deleteMany({
            where: { token: refreshToken }
        });
        return res.json({ message: "Logged out successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" })
    }
}
export async function signoutAll(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        await prisma.refreshToken.deleteMany({
            where: { userId }
        });
        return res.json({ message: "Logged out successfully" });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" })
    }
}

export async function refreshAccessToken(req: Request, res: Response) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: "Refresh token required" });
        }
        // Verify JWT
        const payload = verifyRefreshToken(refreshToken);
        if (!payload) {
            return res.status(401).json({ error: "Invalid refresh token" });
        }
        const storedToken = await prisma.refreshToken.findFirst({
            where: {
                userId: payload.id,
                isRevoked: false,
                expiresAt: { gt: new Date() }
            }
        });

        if (!storedToken) {
            return res.status(401).json({ error: "Token revoked or expired" });
        }
        const newAccessToken = signAccessToken({ id: payload.id, role: "user" });

        return res.json({ accessToken: newAccessToken });

    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function sendOtp(req: Request, res: Response) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Please enter a valid email" });
        }
        const user = await prisma.user.findUnique({
            where: { email }
        })
        if (!user) {
            return res.status(401).json({ error: "No user found with this email" });
        }
        const createEmailOtp = await createOtp(user.id, "EMAIL");
        await sendOtpEmail(email, createEmailOtp.code);
        return res.json({ message: "OTP sent successfully" },);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to send OTP" });
    }
}

export async function verifyOtpEmail(req: Request, res: Response) {
    try {
        const { email, code } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Please enter a valid email" });
        }
        if (!code) {
            return res.status(400).json({ message: "Please enter otp" });
        }
        const user = await prisma.user.findUnique({
            where: { email }
        })
        if (!user) {
            return res.status(401).json({ error: "No user found with this email" });
        }
        const verifyEmailOtp = await verifyOtp(user.id, code, "EMAIL");
        if (verifyEmailOtp.valid) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    isEmailVerified: true
                }
            })
            return res.status(200).json({ message: verifyEmailOtp.message })
        } else {
            return res.status(400).json({ messsage: "Invalid OTP. Please enter correct otp" })
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to verify OTP" })
    }
}

export async function forgotPassword(req: Request, res: Response) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Please enter a valid email" });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(200).json({ message: "User doesn't exist with this email" })
        }
        const otpResult = await createOtp(user.id, "RESET_PASSWORD");
        await sendOtpEmail(email, otpResult.code);

        return res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to process request" });
    }
}

export async function resetPassword(req: Request, res: Response) {
    try {
        const { email, code, newPassword } = req.body;
        if (!email || !code || !newPassword) {
            return res.status(400).json({ error: "Email, OTP code, and new password are required" });
        }
        // Validate password length
        if (newPassword.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }
        const otpResult = await verifyOtp(user.id, code, "RESET_PASSWORD");
        if (!otpResult.valid) {
            return res.status(400).json({ error: "invalid or expired OTP" });
        }
        const hashedPassword = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });
        return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to reset password" });
    }
}

export async function changePassword(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        
        const { oldPassword, newPassword } = req.body;
        
        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Verify old password
        const isValidPassword = await comparePassword(oldPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }
        
        // Check if new password is same as old password
        if (oldPassword === newPassword) {
            return res.status(400).json({ error: "New password must be different from current password" });
        }
        
        // Hash and update new password
        const hashedPassword = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });
        
        return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to change password" });
    }
}

