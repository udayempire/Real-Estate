import { prisma } from "../../config/prisma";
import { hashPassword, comparePassword } from "../../utils/password";
import { signAccessToken, signRefreshToken } from "../../utils/jwt";
import { Request, Response } from "express";
import { generateReferralCode } from "../../utils/generateReferralCode";
import { verifyRefreshToken } from "../../utils/jwt";
import { createOtp, generateOtpCode, sendOtpEmail, verifyOtp } from "../../services/otp.service";

const SIGNUP_OTP_EXPIRY_MINUTES = 5;

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function capitalizeFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function createUserFromPendingSignup(pendingSignup: any) {
    const userReferralCode = generateReferralCode(pendingSignup.firstName);
    const createdUser = await prisma.user.create({
        data: {
            firstName: pendingSignup.firstName,
            lastName: pendingSignup.lastName,
            email: pendingSignup.email,
            phone: pendingSignup.phone,
            password: pendingSignup.passwordHash,
            age: pendingSignup.age,
            gender: pendingSignup.gender,
            avatar: pendingSignup.avatar,
            avatarKey: pendingSignup.avatarKey,
            referralCode: userReferralCode,
            referrerId: pendingSignup.referrerDbUserId,
            isEmailVerified: true,
            kyc: {
                create: [
                    {
                        type: "AADHARCARD",
                        docNo: pendingSignup.aadharNo,
                        imageUrl: pendingSignup.kycAadharImageUrl,
                        imageKey: pendingSignup.kycAadharImageKey,
                        status: "PENDING",
                    },
                    {
                        type: "PANCARD",
                        docNo: pendingSignup.panNo,
                        imageUrl: pendingSignup.kycPanImageUrl,
                        imageKey: pendingSignup.kycPanImageKey,
                        status: "PENDING",
                    }
                ]
            }
        }
    });

    const { password, ...user } = createdUser;

    await (prisma as any).pendingSignup.delete({
        where: { email: pendingSignup.email }
    });

    const accessToken = signAccessToken({ id: user.id, role: "user" });
    const refreshToken = signRefreshToken({ id: user.id, role: "user" });
    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
    });

    return { user, accessToken, refreshToken };
}

//check status codes at last
export async function signup(req: Request, res: Response) {
    try {
        const {
            firstName, lastName, email, phone, password, age, gender, avatar, avatarKey, referrerId, otpCode,
            aadharNo, kycAadharImageUrl, kycAadharImageKey,
            panNo, kycPanImageUrl, kycPanImageKey
        } = req.body;

        const normalizedEmail = normalizeEmail(email);
        if (!req.body) {
            return res.status(404).json("Please fill all the details")
        }

        if (!referrerId) {
            return res.status(400).json({
                error: "Referrer ID is required",
                field: "referrerId"
            });
        }

        const existingEmailUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingEmailUser) {
            return res.status(400).json({
                error: "Email already registered",
                field: "email"
            });
        }

        const existingPhoneUser = await prisma.user.findUnique({ where: { phone } });
        if (existingPhoneUser) {
            return res.status(400).json({
                error: "Phone number already registered",
                field: "phone"
            });
        }

        const referrer = await prisma.user.findUnique({
            where: { referralCode: referrerId }
        });
        if (!referrer) {
            return res.status(400).json({
                error: "Invalid referrer Id. Please use a valid referrer ID",
                field: "referrerId"
            });
        }

        const pendingSignup = await (prisma as any).pendingSignup.findUnique({
            where: { email: normalizedEmail }
        });

        // Step 1: send OTP and persist signup details only in pending storage.
        if (!otpCode) {
            const signupOtp = generateOtpCode();
            const otpExpiresAt = new Date(Date.now() + SIGNUP_OTP_EXPIRY_MINUTES * 60 * 1000);

            // If changing phone, validate it's not already in use
            if (pendingSignup && pendingSignup.phone !== phone) {
                // Check if new phone exists in User table
                const existingPhoneInUser = await prisma.user.findUnique({ where: { phone } });
                if (existingPhoneInUser) {
                    return res.status(400).json({
                        message: "Phone number already registered with another account",
                        error: "Phone number already registered with another account",
                        field: "phone"
                    });
                }

                // Check if new phone exists in another PendingSignup record
                const phoneInAnotherPending = await (prisma as any).pendingSignup.findUnique({
                    where: { phone }
                });
                if (phoneInAnotherPending) {
                    return res.status(400).json({
                        message: "Phone number already registered with another account, Please use a different phone number.",
                        error: "Phone number already in use by another pending signup. Please use a different phone number.",
                        field: "phone"
                    });
                }
            }

            await (prisma as any).pendingSignup.upsert({
                where: { email: normalizedEmail },
                create: {
                    firstName: capitalizeFirstLetter(firstName),
                    lastName: capitalizeFirstLetter(lastName),
                    email: normalizedEmail,
                    phone,
                    passwordHash: await hashPassword(password),
                    age,
                    gender,
                    avatar,
                    avatarKey,
                    referrerDbUserId: referrer.id,
                    aadharNo,
                    kycAadharImageUrl,
                    kycAadharImageKey,
                    panNo,
                    kycPanImageUrl,
                    kycPanImageKey,
                    otpCode: signupOtp,
                    otpExpiresAt,
                },
                update: {
                    firstName: capitalizeFirstLetter(firstName),
                    lastName: capitalizeFirstLetter(lastName),
                    phone,
                    passwordHash: await hashPassword(password),
                    age,
                    gender,
                    avatar,
                    avatarKey,
                    referrerDbUserId: referrer.id,
                    aadharNo,
                    kycAadharImageUrl,
                    kycAadharImageKey,
                    panNo,
                    kycPanImageUrl,
                    kycPanImageKey,
                    otpCode: signupOtp,
                    otpExpiresAt,
                }
            });

            await sendOtpEmail(normalizedEmail, signupOtp);
            return res.status(200).json({
                message: "OTP sent to email. Submit signup again with otpCode to complete registration.",
                requiresOtp: true,
            });
        }

        // Step 2 (optional): verify OTP in signup itself and create account.
        if (!pendingSignup || pendingSignup.phone !== phone) {
            return res.status(400).json({
                error: "Signup session expired or mismatched. Please start signup again.",
            });
        }

        if (pendingSignup.otpExpiresAt < new Date()) {
            await (prisma as any).pendingSignup.delete({ where: { id: pendingSignup.id } });
            return res.status(400).json({
                error: "OTP expired. Please signup again to receive a new OTP.",
            });
        }

        if (pendingSignup.otpCode !== otpCode) {
            return res.status(400).json({
                error: "Invalid OTP",
            });
        }

        const { user, accessToken, refreshToken } = await createUserFromPendingSignup(pendingSignup);

        return res.status(201).json({
            message: "Signup completed successfully",
            accessToken,
            refreshToken,
            user,
        });
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
            if (field === 'phone') {
                return res.status(400).json({
                    error: "Phone number already registered",
                    field: "phone"
                });
            }
            if (field === 'PendingSignup_phone_key' || field === 'phone_key') {
                return res.status(400).json({
                    error: "A signup is already pending with this phone number",
                    field: "phone"
                });
            }
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
        const { identifier, password } = req.body;
        if (!req.body) {
            return res.status(400).json("Please fill valid credentials to proceed")
        }
        // Check if identifier is email or phone
        const isEmail = identifier.includes('@');
        const normalizedIdentifier = isEmail ? normalizeEmail(identifier) : identifier;
        const user = await prisma.user.findUnique({
            where: isEmail ? { email: normalizedIdentifier } : { phone: normalizedIdentifier }
        })
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" })
        }

        if (user.isBlocked) {
            return res.status(403).json({
                error: "Your account is blocked. Contact contact@realbro.io or 8085671414",
                code: "ACCOUNT_BLOCKED",
            });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({
                error: "Email not verified. Please verify OTP first.",
                code: "EMAIL_NOT_VERIFIED",
            });
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

        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { id: true, isBlocked: true },
        });

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                error: "Your account is blocked. Contact contact@realbro.io or 8085671414",
                code: "ACCOUNT_BLOCKED",
            });
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

        const normalizedEmail = normalizeEmail(email);

        const pendingSignup = await (prisma as any).pendingSignup.findFirst({
            where: {
                email: {
                    equals: normalizedEmail,
                    mode: "insensitive",
                },
            },
        });

        if (!pendingSignup) {
            return res.status(400).json({
                error: "Signup session not found. Please start signup again.",
            });
        }

        const code = generateOtpCode();
        const otpExpiresAt = new Date(Date.now() + SIGNUP_OTP_EXPIRY_MINUTES * 60 * 1000);

        await (prisma as any).pendingSignup.update({
            where: { id: pendingSignup.id },
            data: {
                otpCode: code,
                otpExpiresAt,
            },
        });

        await sendOtpEmail(normalizedEmail, code);
        return res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to send OTP" });
    }
}

export async function verifyOtpEmail(req: Request, res: Response) {
    try {
        const { email, code, otp, otpCode } = req.body;
        const normalizedCode = code || otp || otpCode;
        const normalizedEmail = normalizeEmail(email);
        if (!email) {
            return res.status(400).json({ message: "Please enter a valid email" });
        }
        if (!normalizedCode) {
            return res.status(400).json({ message: "Please enter otp" });
        }

        const pendingSignup = await (prisma as any).pendingSignup.findFirst({
            where: {
                email: {
                    equals: normalizedEmail,
                    mode: "insensitive",
                },
            },
        });

        if (!pendingSignup) {
            const existingUser = await prisma.user.findUnique({
                where: { email: normalizedEmail },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    avatar: true,
                    avatarKey: true,
                    age: true,
                    gender: true,
                    isBlocked: true,
                    referralCode: true,
                    referrerId: true,
                    points: true,
                    blockedBy: true,
                    blockedOn: true,
                    isEmailVerified: true,
                    blueTick: true,
                    isVerifiedSeller: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (existingUser?.isEmailVerified) {
                return res.status(200).json({
                    message: "OTP already verified. Please continue.",
                    alreadyVerified: true,
                    user: existingUser,
                });
            }

            return res.status(400).json({
                error: "Signup session not found. Please start signup again.",
            });
        }

        if (pendingSignup.otpExpiresAt < new Date()) {
            await (prisma as any).pendingSignup.delete({ where: { id: pendingSignup.id } });
            return res.status(400).json({
                error: "OTP expired. Please start signup again.",
            });
        }

        if (pendingSignup.otpCode !== normalizedCode) {
            return res.status(400).json({ error: "Invalid OTP. Please enter correct otp" });
        }

        const { user, accessToken, refreshToken } = await createUserFromPendingSignup(pendingSignup);
        return res.status(200).json({
            message: "Signup completed successfully",
            accessToken,
            refreshToken,
            user,
        });
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

        const normalizedEmail = normalizeEmail(email);

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (!user) {
            return res.status(200).json({ message: "User doesn't exist with this email" })
        }
        const otpResult = await createOtp(user.id, "RESET_PASSWORD");
        await sendOtpEmail(normalizedEmail, otpResult.code);

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

        const normalizedEmail = normalizeEmail(email);
        // Validate password length
        if (newPassword.length < 8) {
            return res.status(400).json({ error: "Password must be at least 8 characters" });
        }
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
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

