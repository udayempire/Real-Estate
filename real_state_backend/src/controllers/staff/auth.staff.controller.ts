import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { comparePassword } from "../../utils/password";
import { signAccessToken, signRefreshToken, signStaffChallengeToken, verifyRefreshToken, verifyStaffChallengeToken } from "../../utils/jwt";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

type StaffAuthAccount = {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    isTwoFactorEnabled: boolean;
    twoFactorSecret: string | null;
    accountType: "SUPER_ADMIN" | "STAFF";
    passwordHash: string;
};

async function getAccountByEmail(email: string): Promise<StaffAuthAccount | null> {
    const [superAdmin, staff] = await Promise.all([
        prisma.superAdmin.findUnique({ where: { email } }),
        prisma.staff.findUnique({ where: { email } }),
    ]);

    if (superAdmin) {
        return {
            id: superAdmin.id,
            email: superAdmin.email,
            role: "SUPER_ADMIN",
            isActive: superAdmin.isActive,
            isTwoFactorEnabled: superAdmin.isTwoFactorEnabled,
            twoFactorSecret: superAdmin.twoFactorSecret,
            accountType: "SUPER_ADMIN",
            passwordHash: superAdmin.passwordHash,
        };
    }

    if (staff) {
        return {
            id: staff.id,
            email: staff.email,
            role: staff.role,
            isActive: staff.isActive,
            isTwoFactorEnabled: staff.isTwoFactorEnabled,
            twoFactorSecret: staff.twoFactorSecret,
            accountType: "STAFF",
            passwordHash: staff.passwordHash ?? "",
        };
    }

    return null;
}

async function getAccountByChallenge(challengeToken: string): Promise<StaffAuthAccount | null> {
    const payload = verifyStaffChallengeToken(challengeToken);
    if (!payload) {
        return null;
    }

    if (payload.accountType === "SUPER_ADMIN") {
        const superAdmin = await prisma.superAdmin.findUnique({
            where: { id: payload.id },
        });
        if (!superAdmin) {
            return null;
        }
        return {
            id: superAdmin.id,
            email: superAdmin.email,
            role: "SUPER_ADMIN",
            isActive: superAdmin.isActive,
            isTwoFactorEnabled: superAdmin.isTwoFactorEnabled,
            twoFactorSecret: superAdmin.twoFactorSecret,
            accountType: "SUPER_ADMIN",
            passwordHash: superAdmin.passwordHash,
        };
    }

    const staff = await prisma.staff.findUnique({
        where: { id: payload.id },
    });
    if (!staff) {
        return null;
    }
    return {
        id: staff.id,
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive,
        isTwoFactorEnabled: staff.isTwoFactorEnabled,
        twoFactorSecret: staff.twoFactorSecret,
        passwordHash: staff.passwordHash ?? "",
        accountType: "STAFF",
    };
}

export async function signin(req: Request, res: Response) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const staff = await getAccountByEmail(email);
        if (!staff) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        if (!staff.isActive) {
            return res.status(403).json({ error: "Account is inactive" });
        }

        const isValidPassword = await comparePassword(password, staff.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const has2fa = Boolean(staff.isTwoFactorEnabled && staff.twoFactorSecret);
        const nextStep = has2fa ? "VERIFY_2FA" : "SETUP_2FA";
        const challengeToken = signStaffChallengeToken({
            id: staff.id,
            role: staff.role,
            accountType: staff.accountType,
            step: nextStep,
        });

        return res.status(200).json({
            nextStep,
            challengeToken,
            user: {
                id: staff.id,
                role: staff.role,
                email: staff.email,
            }
        });
    } catch (error) {
        console.error("signin error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function setup2fa(req: Request, res: Response) {
    try {
        const { challengeToken } = req.body;
        const challengePayload = verifyStaffChallengeToken(challengeToken);
        if (!challengePayload || challengePayload.step !== "SETUP_2FA") {
            return res.status(401).json({ error: "Invalid or expired challenge token" });
        }

        const user = await getAccountByChallenge(challengeToken);
        if (!user) {
            return res.status(404).json({ error: "Account not found" });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: "Account is inactive" });
        }

        const secret = speakeasy.generateSecret({
            name: `RealBro (${user.email})`,
            issuer: "RealBro",
            length: 20,
        });
        if (!secret.otpauth_url || !secret.base32) {
            return res.status(500).json({ error: "Failed to generate 2FA secret" });
        }
        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

        if (user.accountType === "SUPER_ADMIN") {
            await prisma.superAdmin.update({
                where: { id: user.id },
                data: {
                    twoFactorSecret: secret.base32,
                    isTwoFactorEnabled: false,
                },
            });
        } else {
            await prisma.staff.update({
                where: { id: user.id },
                data: {
                    twoFactorSecret: secret.base32,
                    isTwoFactorEnabled: false,
                },
            });
        }
        const verifyChallengeToken = signStaffChallengeToken({
            id: user.id,
            role: user.role,
            accountType: user.accountType,
            step: "VERIFY_2FA",
        });

        return res.status(200).json({
            message: "2FA setup successful",
            data: {
                challengeToken: verifyChallengeToken,
                email: user.email,
                qrCodeDataUrl,
                manualSetupCode: secret.base32,
                otpauthUrl: secret.otpauth_url,
            },
        });
    } catch (error) {
        console.error("setup2fa error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function confirm2faSetup(req: Request, res: Response) {
    try {
        const { challengeToken, code } = req.body;
        const challengePayload = verifyStaffChallengeToken(challengeToken);
        if (!challengePayload || challengePayload.step !== "VERIFY_2FA") {
            return res.status(401).json({ error: "Invalid or expired challenge token" });
        }

        const user = await getAccountByChallenge(challengeToken);
        if (!user) {
            return res.status(404).json({ error: "Account not found" });
        }
        if (!user.isActive) {
            return res.status(403).json({ error: "Account is inactive" });
        }

        const secret = user.twoFactorSecret;
        if (!secret) {
            return res.status(400).json({ error: "2FA setup not initiated" });
        }
        const isValid = speakeasy.totp.verify({
            secret,
            encoding: "base32",
            token: code,
            window: 1,
        });
        if (!isValid) {
            return res.status(400).json({ error: "Invalid 2FA code" });
        }

        if (user.accountType === "SUPER_ADMIN") {
            await prisma.superAdmin.update({
                where: { id: user.id },
                data: { isTwoFactorEnabled: true },
            });
        } else {
            await prisma.staff.update({
                where: { id: user.id },
                data: { isTwoFactorEnabled: true },
            });
        }
        const accessToken = signAccessToken({ id: user.id, role: user.role });
        const refreshToken = signRefreshToken({ id: user.id, role: user.role });

        const isProd = process.env.NODE_ENV === "production";
        const cookieOptions = {
            httpOnly: true,
            secure: isProd,
            sameSite: "lax" as const,
            path: "/",
        };

        res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
        res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 28 * 24 * 60 * 60 * 1000 }); // 28 days

        return res.status(200).json({
            message: "2FA setup confirmed",
            user: {
                id: user.id,
                role: user.role,
            },
        });

    } catch (error) {
        console.error("confirm2faSetup error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}


export async function verify2fa(req: Request, res: Response) {
    try {
        const { challengeToken, code } = req.body;
        const challengePayload = verifyStaffChallengeToken(challengeToken);
        if (!challengePayload || challengePayload.step !== "VERIFY_2FA") {
            return res.status(401).json({ error: "Invalid or expired challenge token" });
        }

        const user = await getAccountByChallenge(challengeToken);
        if (!user) {
            return res.status(404).json({ error: "Account not found" });
        }
        if (!user.isActive) {
            return res.status(403).json({ error: "Account is inactive" });
        }
        if (!user.isTwoFactorEnabled) {
            return res.status(400).json({ error: "2FA not enabled. Complete setup first." });
        }

        const secret = user.twoFactorSecret;
        if (!secret) {
            return res.status(400).json({ error: "2FA is not setup for this account" });
        }

        const isValid = speakeasy.totp.verify({
            secret,
            encoding: "base32",
            token: code,
            window: 1,
        });
        if (!isValid) {
            return res.status(400).json({ error: "Invalid 2FA code" });
        }

        const accessToken = signAccessToken({ id: user.id, role: user.role });
        const refreshToken = signRefreshToken({ id: user.id, role: user.role });

        const isProd = process.env.NODE_ENV === "production";
        const cookieOptions = {
            httpOnly: true,
            secure: isProd,
            sameSite: "lax" as const,
            path: "/",
        };

        res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
        res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 28 * 24 * 60 * 60 * 1000 }); // 28 days
        res.cookie("role", user.role, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

        return res.status(200).json({
            message: "2FA verification successful",
            user: {
                id: user.id,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("verify2fa error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function me(req: Request, res: Response) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        const profile =
            user.role === "SUPER_ADMIN"
                ? await prisma.superAdmin.findUnique({
                    where: { id: user.id },
                    select: { firstName: true, lastName: true, email: true },
                })
                : await prisma.staff.findUnique({
                    where: { id: user.id },
                    select: { firstName: true, lastName: true, email: true },
                });

        if (!profile) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({
            user: {
                id: user.id,
                role: user.role,
                firstName: profile.firstName ?? "",
                lastName: profile.lastName ?? "",
                email: profile.email,
            },
        });
    } catch (error) {
        console.error("me error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function signout(req: Request, res: Response) {
    try {
        // Read refreshToken from cookie (httpOnly) or body (backward compatibility)
        const refreshToken = req.cookies?.refreshToken ?? req.body?.refreshToken;
        if (refreshToken) {
            await prisma.refreshToken.deleteMany({
                where: { token: refreshToken }
            });
        }
        // Clear auth cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
            path: "/",
        };
        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);
        res.clearCookie("role", cookieOptions);
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("signout error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function refreshAccessToken(req: Request, res: Response) {
    try {
        // Read refreshToken from cookie (httpOnly) or body (backward compatibility)
        const refreshToken = req.cookies?.refreshToken ?? req.body?.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ error: "Refresh token required" });
        }

        const payload = verifyRefreshToken(refreshToken);
        if (!payload) {
            return res.status(401).json({ error: "Invalid or expired refresh token" });
        }

        const newAccessToken = signAccessToken({ id: payload.id, role: payload.role! });

        const isProd = process.env.NODE_ENV === "production";
        const cookieOptions = {
            httpOnly: true,
            secure: isProd,
            sameSite: "lax" as const,
            path: "/",
        };

        res.cookie("accessToken", newAccessToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

        return res.status(200).json({
            message: "Access token refreshed",
            user: { id: payload.id, role: payload.role },
        });
    } catch (error) {
        console.error("refreshAccessToken error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}