import { z } from "zod";

export const createStaffSchema = z.object({
    firstName: z.string().min(2, "First name must be atleast 2 characters"),
    lastName: z.string().min(2, "last name must be atleast 2 characters"),
    age: z.number().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    phone: z.string().regex(/^\+[1-9]\d{6,14}$/, "Invalid phone number").optional(),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "password must be atleast 6 characters long"),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "VIEWER", "CUSTOMER_SUPPORT"]),
});
export const updateStaffSchema = z.object({
    firstName: z.string().min(2, "First name must be atleast 2 characters").optional(),
    lastName: z.string().min(2, "last name must be atleast 2 characters").optional(),
    age: z.number().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    phone: z.string().regex(/^\+[1-9]\d{6,14}$/, "Invalid phone number").optional(),
    email: z.string().email("Invalid email").optional(),
    password: z.string().min(6, "password must be atleast 6 characters long").optional(),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "VIEWER", "CUSTOMER_SUPPORT"]),
});


export const staffSigninSchema = z.object({
    email: z.email("Invalid email"),
    password: z.string().min(1, "Password is required"),
});

export const setup2faSchema = z.object({
    challengeToken: z.string().min(1, "challengeToken is required"),
});

export const verify2faSchema = z.object({
    challengeToken: z.string().min(1, "challengeToken is required"),
    code: z.string().length(6, "2FA code must be 6 digits"),
});

export const signoutStaffSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
});

export type createStaffInput = z.infer<typeof createStaffSchema>;
export type updateStaffInput = z.infer<typeof updateStaffSchema>;
export type verify2faInput = z.infer<typeof verify2faSchema>;
export type signoutStaffInput = z.infer<typeof signoutStaffSchema>;