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

export type createStaffInput = z.infer<typeof createStaffSchema>;