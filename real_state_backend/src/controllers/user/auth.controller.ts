import { prisma } from "../../config/prisma";
import { hashPassword, comparePassword } from "../../utils/password";
import { signAccessToken, signRefreshToken } from "../../utils/jwt";
import { Request, Response } from "express";
import { generateReferralCode } from "../../utils/generateReferralCode";


//check status codes at last
export async function signup(req: Request, res: Response) {
    function capitalizeFirstLetter(str: string): string {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    try {
        const { firstName, lastName, email, phone, password, referrerId } = req.body
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
                referralCode: userReferralCode,
                referrerId: referrer?.id
            }
        })
        //write logic to award points to one to referrers after clarification from team.
        const accessToken = signAccessToken({ id: user.id, role: "user" });
        const refereshToken = signRefreshToken({ id: user.id, role: "user" });
        await prisma.refreshToken.create({
            data: {
                token: await hashPassword(refereshToken),
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }
        });
        return res.json({ accessToken, refereshToken, user })
    } catch (error) {
        return res.status(500).json(error)
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
            return res.status(401).json({ message: "User not found. Please signup" })
        }
        //check password
        const isValid = await comparePassword(user.password);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const accessToken = signAccessToken({ id: user.id, role: "user" });
        const refereshToken = signRefreshToken({ id: user.id, role: "user" })
        await prisma.refreshToken.create({
            data: {
                token: await hashPassword(refereshToken),
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            }
        });
        return res.json({ accessToken, refereshToken, user })

    } catch (error) {
        return res.status(500).json(error);
    }
}

export async function signout(req: Request, res: Response) {
    try {
        const refreshToken = req.body;
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