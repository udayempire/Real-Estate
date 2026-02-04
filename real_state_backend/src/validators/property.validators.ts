import z from "zod";

export const StatusEnum = [
    "ACTIVE",
    "INACTIVE",
    "SOLD",
    "DRAFT",
] as const;
export const propertyTypeEnum = [
    "FARMLAND",
    "DUPLEX",
    "FLAT",
    "PLOT",
]

export const MediaTypeEnum = ["IMAGE", "VIDEO"] as const;

export const propertyMediaSchema = z.object({
    url: z.url(),
    key: z.string(),
    mediaType: z.enum(MediaTypeEnum),
    order: z.number().int().min(0).optional(),
})

export const addProperty = z.object({
    title: z.string(),
    description: z.string(),
    status:    z.enum(StatusEnum).default("ACTIVE"),
    propertyType: z.enum(propertyTypeEnum),
    priceMin: z.number(),
    priceMax: z.number(),
    state: z.string(),
    city: z.string(),
    area: z.string(),
    address: z.string(),
    longitude: z.number(),
    latitude: z.number(),
    size: z.number(),
    media: z.array(propertyMediaSchema).min(1,"At least one media file is required")
});

export type addPropertyInput = z.infer<typeof addProperty>;
