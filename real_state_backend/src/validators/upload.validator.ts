import { z } from "zod";

export const uploadSchema = z.object({
    fileName: z.string().min(1),
    contentType: z.string().min(1),
    purpose: z.enum(["KYC_AADHAR", "KYC_PAN", "PROPERTY_IMAGE", "PROPERTY_VIDEO", "USER_AVATAR"])
})
export type uploadSchema = z.infer<typeof uploadSchema>