import { prisma } from "../config/prisma";
import { OtpType } from "@prisma/client";
import { Resend } from "resend";
// import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const OTP_EXPIRY_MINUTES = 5;
const OTP_LENGTH = 6;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// const sesClient = new SESClient({
//     region: process.env.AWS_SES_REGION || process.env.AWS_REGION,
//     credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
//         ? {
//             accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//             secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//         }
//         : undefined,
// });

// async function sendEmailViaSes(toEmail: string, subject: string, htmlBody: string) {
//     const fromEmail = process.env.AWS_SES_FROM_EMAIL;
//     if (!fromEmail) {
//         throw new Error("AWS_SES_FROM_EMAIL is not configured");
//     }
//
//     const command = new SendEmailCommand({
//         Source: fromEmail,
//         Destination: {
//             ToAddresses: [toEmail],
//         },
//         Message: {
//             Subject: {
//                 Data: subject,
//                 Charset: "UTF-8",
//             },
//             Body: {
//                 Html: {
//                     Data: htmlBody,
//                     Charset: "UTF-8",
//                 },
//             },
//         },
//     });
//
//     return sesClient.send(command);
// }

async function sendEmailViaResend(toEmail: string, subject: string, htmlBody: string) {
    if (!resend) {
        throw new Error("RESEND_API_KEY is not configured");
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
    const { error } = await resend.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject,
        html: htmlBody,
    });

    if (error) {
        throw new Error(error.message);
    }
}

export function generateOtpCode(length: number = OTP_LENGTH): string {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
}

export async function createOtp(userId: string, type: OtpType) {
    await prisma.otp.updateMany({
        where: {
            userId,
            type,
            isRevoked: false,
        },
        data: {
            isRevoked: true,
        },
    });

    const code: string = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const otp = await prisma.otp.create({
        data: {
            code,
            type,
            expiresAt,
            userId,
        },
    });

    return { otp, code };
}

export async function verifyOtp(userId: string, code: string, type: OtpType) {
    const otp = await prisma.otp.findFirst({
        where: {
            userId,
            code,
            type,
            isRevoked: false,
            expiresAt: { gt: new Date() },
        },
    });

    if (!otp) {
        return { valid: false, message: "Invalid or expired OTP" };
    }

    await prisma.otp.update({
        where: { id: otp.id },
        data: { isRevoked: true },
    });

    return { valid: true, message: "OTP verified successfully" };
}

export async function revokeOtp(otpId: string) {
    return prisma.otp.update({
        where: { id: otpId },
        data: { isRevoked: true },
    });
}

export async function revokeAllUserOtps(userId: string, type?: OtpType) {
    return prisma.otp.updateMany({
        where: {
            userId,
            isRevoked: false,
            ...(type && { type }),
        },
        data: {
            isRevoked: true,
        },
    });
}

export async function cleanupExpiredOtps() {
    return prisma.otp.deleteMany({
        where: {
            OR: [
                { expiresAt: { lt: new Date() } },
                { isRevoked: true },
            ],
        },
    });
}

export async function getLatestValidOtp(userId: string, type: OtpType) {
    return prisma.otp.findFirst({
        where: {
            userId,
            type,
            isRevoked: false,
            expiresAt: { gt: new Date() },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function sendOtpEmail(email: string, otp: string) {
    try {
        await sendEmailViaResend(
            email,
            "Your OTP code is here",
            `
            <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
              <h2 style="color:#333;">OTP Verification</h2>
              <p>Your OTP code is:</p>

              <div style="background-color:#f5f5f5; padding:20px; text-align:center; margin:20px 0;">
                <span style="font-size:24px; font-weight:bold; color:#007bff; letter-spacing:2px;">
                  ${otp}
                </span>
              </div>

              <p style="color:#666;">This code is valid for 5 minutes.</p>
              <p style="color:#666; font-size:12px;">
                If you didn't request this code, please ignore this email.
              </p>
            </div>
            `
        );
    } catch (error) {
        throw new Error(`Failed to send OTP email: ${error}`);
    }
}

export async function sendAccountBlockedEmail(email: string) {
    try {
        return await sendEmailViaResend(
            email,
            "Your Realbro account has been blocked",
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Account Blocked</h2>
              <p>Your Realbro account has been blocked by the admin team.</p>
              <p>If you think this is a mistake, please contact us:</p>
              <p style="margin: 0;">Email: <strong>contact@realbro.io</strong></p>
              <p style="margin: 8px 0 0;">Phone: <strong>8085671414</strong></p>
            </div>
            `
        );
    } catch (error) {
        throw new Error(`Failed to send blocked email: ${error}`);
    }
}
