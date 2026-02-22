import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: result.error.flatten().fieldErrors
            });
        }
        req.body = result.data;  // Replace with validated/typed data
        next();
    }
};

// Validate query parameters (for GET requests)
export function validateQuery(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: result.error.flatten().fieldErrors
            });
        }
        req.query = result.data as any;  // Replace with validated/typed data
        next();
    }
};
