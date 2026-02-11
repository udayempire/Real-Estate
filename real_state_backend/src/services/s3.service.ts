import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type UploadPurpose =
    | "KYC_AADHAR"
    | "KYC_PAN"
    | "PROPERTY_IMAGE"
    | "PROPERTY_VIDEO"
    | "USER_AVATAR";

type CreatePresignedUploadInput = {
    fileName: string;
    contentType: string;
    purpose: UploadPurpose;
    userId?: string;
};

type CreatePresignedUploadOutput = {
    uploadUrl: string;
    key: string;
    fileUrl: string;
    expiresIn: number;
};

const ALLOWED_CONTENT_TYPES: Record<UploadPurpose, readonly string[]> = {
    KYC_AADHAR: ["image/jpeg", "image/png", "application/pdf"],
    KYC_PAN: ["image/jpeg", "image/png", "application/pdf"],
    PROPERTY_IMAGE: ["image/jpeg", "image/png", "image/webp"],
    PROPERTY_VIDEO: ["video/mp4", "video/quicktime"],
    USER_AVATAR: ["image/jpeg", "image/png", "image/webp"],
};

const EXT_BY_CONTENT_TYPE: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
};

function getFileExtension(fileName: string, contentType: string): string {
    const fromName = fileName.split(".").pop()?.toLowerCase();
    if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
    return EXT_BY_CONTENT_TYPE[contentType] ?? "bin";
};

function encodeS3KeyPath(key: string): string {
    return key.split("/").map(encodeURIComponent).join("/");
};

function assertAllowedContentType(purpose: UploadPurpose, contentType: string): void {
    const allowed = ALLOWED_CONTENT_TYPES[purpose];
    if (!allowed.includes(contentType)) {
        throw new Error(`Unsupported contentType "${contentType}" for purpose "${purpose}"`);
    }
};

function purposeFolder(purpose: UploadPurpose): string {
    switch (purpose) {
        case "KYC_AADHAR":
            return "kyc/aadhar";
        case "KYC_PAN":
            return "kyc/pan";
        case "PROPERTY_IMAGE":
            return "property/images";
        case "PROPERTY_VIDEO":
            return "property/videos";
        case "USER_AVATAR":
            return "user/avatar";
    }
};

export async function createPresignedUpload({ fileName, contentType, purpose, userId}: CreatePresignedUploadInput): Promise<CreatePresignedUploadOutput> {
    const region = process.env.AWS_REGION;
    const bucket = process.env.AWS_S3_BUCKET;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region || !bucket || !accessKeyId || !secretAccessKey) {
        throw new Error("Missing AWS env vars: AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY");
    }

    assertAllowedContentType(purpose, contentType);
    const expiresInRaw = Number(process.env.S3_PRESIGN_EXPIRES ?? 300);
    const expiresIn = Number.isFinite(expiresInRaw) ? Math.max(60, Math.min(expiresInRaw, 900)) : 300;
    const ext = getFileExtension(fileName, contentType);
    const owner = userId ?? "guest";
    const key = `${purposeFolder(purpose)}/${owner}/${Date.now()}-${randomUUID()}.${ext}`;
    const s3 = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
    });
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
    const baseUrl =
        process.env.S3_PUBLIC_BASE_URL?.replace(/\/+$/, "") ??
        `https://${bucket}.s3.${region}.amazonaws.com`;
    const fileUrl = `${baseUrl}/${encodeS3KeyPath(key)}`;
    return {
        uploadUrl,
        key,
        fileUrl,
        expiresIn,
    };
}