import { Request, Response } from "express";
import { createPresignedUpload } from "../../services/s3.service";
import { uploadSchema } from "../../validators/upload.validator";
import z from "zod";

export async function presignedUpload(req: Request, res: Response) {
    try {
        type UploadInput = z.infer<typeof uploadSchema>;
        const { fileName, contentType, purpose } = req.body as UploadInput;
        const result = await createPresignedUpload({
            fileName,
            contentType,
            purpose,
            userId: req.user?.id,
        });
        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        console.error("presignUpload error:", error);
        if (
            error?.message?.includes("Unsupported contentType") ||
            error?.message?.includes("Missing AWS env vars")
        ) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Failed to create upload URL",
        });
    }
}