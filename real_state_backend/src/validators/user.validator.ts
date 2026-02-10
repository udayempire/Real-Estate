import { z } from "zod";

export const signupSchema = z.object({
    firstName: z.string().min(2, "First name must be atleast 2 characters"),
    lastName: z.string().min(2, "last name must be atleast 2 characters"),
    email: z.email("Invalid email"),
    phone: z.string().regex(
        /^\+[1-9]\d{6,14}$/,
        'Invalid phone number. Use international format: +1234567890'
    ),
    password: z.string().min(6, "password must be atleast 6 characters long"),
    referrerId: z.string().optional(),
    // Aadhar Section
    aadharNo: z.string().regex(/^\d{12}$/, "Aadhar must be 12 digits"),
    kycAadharImageUrl: z.string().url("Invalid Aadhar image URL"),
    kycAadharImageKey: z.string().min(1, "Aadhar image key is required"),
    // PAN Section
    panNo: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
    kycPanImageUrl: z.string().url("Invalid PAN image URL"),
    kycPanImageKey: z.string().min(1, "PAN image key is required"),
});

export const signinSchema = z.object({
    email: z.email("invalid email"),
    password: z.string()
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("invalid email")
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(6, "password must be atleast 6 characters long")
})

// otp 

export const sendOtpSchema = z.object({
    code: z.string().length(6, 'OTP must be 6 digits'),
    type: z.enum(['EMAIL', 'PHONE']),
})

export const updateProfileSchema = z.object({
    firstName: z.string().min(2, "First name must be atleast 2 characters").optional(),
    lastName: z.string().min(2, "last name must be atleast 2 characters").optional(),
    email: z.email("Invalid email").optional(),
    phone: z.string().regex(
        /^\+[1-9]\d{6,14}$/,
        'Invalid phone number. Use international format: +1234567890'
    ).optional(),
    password: z.string().min(6, "password must be atleast 6 characters long").optional()
})

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type UpdateProfieInput = z.infer<typeof updateProfileSchema>