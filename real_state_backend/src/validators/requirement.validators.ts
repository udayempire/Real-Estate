import z from "zod";

const StatusEnum = z.enum(["NEW", "ACTIVE", "FULFILLED", "CLOSED"]);

export const createRequirementSchema = z.object({
    preferredLocation: z.string().min(1, "preferredLocation is required"),
    subLocation: z.string().optional(),
    propertyType: z.string().optional(),
    budgetMin: z.number().min(0, "budgetMin must be non-negative").optional(),
    budgetMax: z.number().min(0, "budgetMax must be non-negative").optional(),
    currency: z.string().min(1).max(10).default("INR"),
}).refine(
    (data) => {
        if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
            return data.budgetMax >= data.budgetMin;
        }
        return true;
    },
    { message: "budgetMax must be greater than or equal to budgetMin", path: ["budgetMax"] }
);

export const updateRequirementSchema = z.object({
    preferredLocation: z.string().min(1).optional(),
    subLocation: z.string().optional(),
    propertyType: z.string().optional(),
    budgetMin: z.number().min(0).optional(),
    budgetMax: z.number().min(0).optional(),
    currency: z.string().min(1).max(10).optional(),
    status: StatusEnum.optional(),
}).refine(
    (data) => {
        if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
            return data.budgetMax >= data.budgetMin;
        }
        return true;
    },
    { message: "budgetMax must be greater than or equal to budgetMin", path: ["budgetMax"] }
);

export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;
export type UpdateRequirementInput = z.infer<typeof updateRequirementSchema>;
