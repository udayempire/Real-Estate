import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { comparePassword } from "../../utils/password";
import { signAccessToken, signRefreshToken } from "../../utils/jwt";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export async function signin(req: Request, res: Response) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        };
        const [superAdmin, staff] = await Promise.all([
            prisma.superAdmin.findUnique({
                where: { email }
            }),
            prisma.staff.findUnique({
                where: { email }
            })
        ]);
        let user: any = null;
        let role: string = "";

        if (superAdmin) {
            user = superAdmin;
            role = "SUPER_ADMIN";
        } else if (staff) {
            user = staff;
            role = staff.role;
        } else {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const accessToken = signAccessToken({ id: user.id, role: role });
        const refreshToken = signRefreshToken({ id: user.id, role: role });
        return res.status(200).json({
            accessToken, refreshToken, user: {
                id: user.id,
                role: role,
            }
        });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function setup2fa(req: Request, res: Response) {
    try {
        const { email } = req.body;
        const [superAdmin, staff] = await Promise.all([
            prisma.superAdmin.findUnique({ where: { email } }),
            prisma.staff.findUnique({ where: { email } }),
        ]);
        if (!superAdmin && !staff) {
            return res.status(404).json({ error: "Account not found" });
        };

        if ((superAdmin && !superAdmin.isActive) || (staff && !staff.isActive)) {
            return res.status(403).json({ error: "Account is inactive" });
        };
        const secret = speakeasy.generateSecret({
            name: `RealBro (${email})`,
            issuer: "RealBro",
            length: 20,
        });
        if (!secret.otpauth_url || !secret.base32) {
            return res.status(500).json({ error: "Failed to generate 2FA secret" });
        };
        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);
        if (superAdmin) {
            await prisma.superAdmin.update({
                where: { id: superAdmin.id },
                data: {
                    twoFactorSecret: secret.base32,
                    isTwoFactorEnabled: false,
                },
            });
        } else if (staff) {
            await prisma.staff.update({
                where: { id: staff.id },
                data: {
                    twoFactorSecret: secret.base32,
                    isTwoFactorEnabled: false,
                },
            });
        }
        return res.status(200).json({
            message: "2FA setup successful",
            data: {
                email,
                qrCodeDataUrl,
                manualSetupCode: secret.otpauth_url,
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
        const { email, code } = req.body;
        const [superAdmin, staff] = await Promise.all([
            prisma.superAdmin.findUnique({ where: { email } }),
            prisma.staff.findUnique({ where: { email } }),
        ]);
        if (!superAdmin && !staff) {
            return res.status(404).json({ error: "Account not found" });
        };
        if ((superAdmin && !superAdmin.isActive) || (staff && !staff.isActive)) {
            return res.status(403).json({ error: "Account is inactive" });
        };
        const secret = superAdmin?.twoFactorSecret ?? staff?.twoFactorSecret;
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
        };
        let userId = "";
        let role = "";
        if (superAdmin) {
            await prisma.superAdmin.update({
                where: { id: superAdmin.id },
                data: { isTwoFactorEnabled: true },
            });
            userId = superAdmin.id;
            role = "SUPER_ADMIN";
        } else if (staff) {
            await prisma.staff.update({
                where: { id: staff.id },
                data: { isTwoFactorEnabled: true },
            });
            userId = staff.id;
            role = staff.role;
        };
        const accessToken = signAccessToken({ id: userId, role });
        const refreshToken = signRefreshToken({ id: userId, role });

        return res.status(200).json({
            message: "2FA setup confirmed",
            accessToken,
            refreshToken,
            user: {
                id: userId,
                role,
            },
        });

    } catch (error) {
        console.error("confirm2faSetup error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}


export async function verify2fa(req: Request, res: Response) {
    try {
        const { email, code } = req.body;
        const [superAdmin, staff] = await Promise.all([
            prisma.superAdmin.findUnique({ where: { email } }),
            prisma.staff.findUnique({ where: { email } }),
        ]);
        if (!superAdmin && !staff) {
            return res.status(404).json({ error: "Account not found" });
        };
        if ((superAdmin && !superAdmin.isActive) || (staff && !staff.isActive)) {
            return res.status(403).json({ error: "Account is inactive" });
        };
        let secret = "";
        if (superAdmin) {
            secret = superAdmin.twoFactorSecret!;
        } else if (staff) {
            secret = staff.twoFactorSecret!;
        }
        const isValid = speakeasy.totp.verify({
            secret: secret,
            encoding: "base32",
            token: code,
            window: 1,
        });
        if (!isValid) {
            return res.status(400).json({ error: "Invalid 2FA code" });
        }
        if (superAdmin) {
            await prisma.superAdmin.update({
                where: { id: superAdmin.id },
                data: { isTwoFactorEnabled: true },
            });
        } else if (staff) {
            await prisma.staff.update({
                where: { id: staff.id },
                data: { isTwoFactorEnabled: true },
            });
        }
        return res.status(200).json({
            message: "2FA verification successful",
        });
    }
    catch (error) {
        console.error("verify2fa error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function signout(req: Request, res: Response) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ error: "Refresh Token not found" });
        }
        await prisma.refreshToken.deleteMany({
            where: { token: refreshToken }
        });
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("signout error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
