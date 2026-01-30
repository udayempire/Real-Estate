import { z } from "zod";

export const signupSchema = z.object({
    firstName: z.string().min(2, "First name must be atleast 2 characters"),
    lastName: z.string().min(2, "last name must be atleast 2 characters"),
    email: z.email("Invalid email"),
    phone: z.string().regex(
        /^\+[1-9]\d{6,14}$/,
        'Invalid phone number. Use international format: +1234567890'
    ),
    password: z.string().min(6,"password must be atleast 6 characters long"),
    referrerId: z.string().optional()
});

export const signinSchema =z.object({
    email: z.email("invalid email"),
    password: z.string()
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("invalid email")
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(6,"password must be atleast 6 characters long")
})

// otp 

export const sendOtpSchema = z.object({
    code: z.string().length(6, 'OTP must be 6 digits'),
    type: z.enum(['EMAIL', 'PHONE']),
})

export const updateProfileSchema = z.object({
    firstName: z.string().min(2, "First name must be atleast 2 characters"),
    lastName: z.string().min(2, "last name must be atleast 2 characters"),
    email: z.email("Invalid email"),
    phone: z.string().regex(
        /^\+[1-9]\d{6,14}$/,
        'Invalid phone number. Use international format: +1234567890'
    ),
    password: z.string().min(6,"password must be atleast 6 characters long")
})

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type UpdateProfieInput = z.infer<typeof updateProfileSchema>