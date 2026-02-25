import z from "zod";

export const StatusEnum = [
    "ACTIVE",
    "UNLISTED",
    "SOLDOFFLINE",
    "SOLDTOREALBRO",
    "SOLDFROMLISTINGS",
    "DRAFT",
] as const;

export const propertyTypeEnum = [
    "FARMLAND",
    "DUPLEX",
    "FLAT",
    "PLOT",
] as const;

export const sizeUnitEnum = [
    "ACRES",
    "UNITS",
    "SQFT",
    "SQMT"
] as const;

export const categoryEnum = [
    "Residential",
    "Commercial",
    "FarmLand"
] as const;

export const furnishingStatusEnum = [
    "FullyFurnished",
    "SemiFurnished",
    "Unfurnished",
    "FencedWired",
    "FertileLand",
    "OpenLand",
    "Cultivated"
] as const;

export const availabilityStatusEnum = [
    "ReadyToMove",
    "UnderConstruction"
] as const;

export const ageOfPropertyEnum = [
    "ZeroToOne",
    "OneToThree",
    "ThreeToSix",
    "SixToTen",
    "TenPlus"
] as const;

export const carpetAreaUnitEnum = [
    "SQFT",
    "SQM",
    "ACRES"
] as const;

export const propertyFacingEnum = [
    "East",
    "West",
    "North",
    "South",
    "NorthEast",
    "NorthWest",
    "SouthEast",
    "SouthWest"
] as const;

export const MediaTypeEnum = ["IMAGE", "VIDEO"] as const;

export const propertyMediaSchema = z.object({
    url: z.string().url(),
    key: z.string(),
    mediaType: z.enum(MediaTypeEnum),
    order: z.number().int().min(0).optional(),
});

export const addPropertySchema = z.object({
    // Basic Info
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    status: z.enum(StatusEnum).default("ACTIVE"),
    propertyType: z.enum(propertyTypeEnum),
    
    // Price - Updated to single listingPrice
    listingPrice: z.number().positive("Listing price must be positive"),
    
    // Location
    state: z.string().min(1, "State is required"),
    city: z.string().min(1, "City is required"),
    locality: z.string().optional(),
    subLocality: z.string().optional(),
    flatNo: z.string().optional(),
    area: z.string().optional(), // For backward compatibility
    address: z.string().min(1, "Address is required"),
    longitude: z.number(),
    latitude: z.number(),
    
    // Size - Updated
    carpetArea: z.number().positive().optional(),
    carpetAreaUnit: z.enum(carpetAreaUnitEnum).optional(),
    
    // Basic Details - New
    category: z.enum(categoryEnum).optional(),
    furnishingStatus: z.enum(furnishingStatusEnum).optional(),
    availabilityStatus: z.enum(availabilityStatusEnum).optional(),
    ageOfProperty: z.enum(ageOfPropertyEnum).optional(),
    
    // Property Details - New
    numberOfRooms: z.number().int().min(0).optional(),
    numberOfBathrooms: z.number().int().min(0).optional(),
    numberOfBalcony: z.number().int().min(0).optional(),
    numberOfFloors: z.number().int().min(0).optional(),
    propertyFloor: z.string().optional(),
    
    // Price Details - New
    allInclusivePrice: z.boolean().default(false),
    negotiablePrice: z.boolean().default(false),
    govtChargesTaxIncluded: z.boolean().default(false),
    
    // Other Details - New
    propertyFacing: z.enum(propertyFacingEnum).optional(),
    amenities: z.array(z.string()).default([]),
    locationAdvantages: z.array(z.string()).default([]),
    coveredParking: z.number().int().min(0).default(0),
    uncoveredParking: z.number().int().min(0).default(0),
    
    // Media
    media: z.array(propertyMediaSchema).min(1, "At least one media file is required")
});

// Draft Property Schema - Only title is required, status is always DRAFT
export const addDraftPropertySchema = z.object({
    // Basic Info - Only title is required
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    propertyType: z.enum(propertyTypeEnum).optional(),
    
    // Price
    listingPrice: z.number().positive("Listing price must be positive").optional(),
    
    // Location
    state: z.string().optional(),
    city: z.string().optional(),
    locality: z.string().optional(),
    subLocality: z.string().optional(),
    flatNo: z.string().optional(),
    area: z.string().optional(),
    address: z.string().optional(),
    longitude: z.number().optional(),
    latitude: z.number().optional(),
    
    // Size
    carpetArea: z.number().positive().optional(),
    carpetAreaUnit: z.enum(carpetAreaUnitEnum).optional(),
    
    // Basic Details
    category: z.enum(categoryEnum).optional(),
    furnishingStatus: z.enum(furnishingStatusEnum).optional(),
    availabilityStatus: z.enum(availabilityStatusEnum).optional(),
    ageOfProperty: z.enum(ageOfPropertyEnum).optional(),
    
    // Property Details
    numberOfRooms: z.number().int().min(0).optional(),
    numberOfBathrooms: z.number().int().min(0).optional(),
    numberOfBalcony: z.number().int().min(0).optional(),
    numberOfFloors: z.number().int().min(0).optional(),
    propertyFloor: z.string().optional(),
    
    // Price Details
    allInclusivePrice: z.boolean().optional(),
    negotiablePrice: z.boolean().optional(),
    govtChargesTaxIncluded: z.boolean().optional(),
    
    // Other Details
    propertyFacing: z.enum(propertyFacingEnum).optional(),
    amenities: z.array(z.string()).optional(),
    locationAdvantages: z.array(z.string()).optional(),
    coveredParking: z.number().int().min(0).optional(),
    uncoveredParking: z.number().int().min(0).optional(),
    
    // Media - Optional for draft
    media: z.array(propertyMediaSchema).optional()
});

export const updatePropertySchema = z.object({
    // Basic Info
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(StatusEnum).optional(),
    propertyType: z.enum(propertyTypeEnum).optional(),
    
    // Price
    listingPrice: z.number().positive().optional(),
    
    // Location
    state: z.string().optional(),
    city: z.string().optional(),
    locality: z.string().optional(),
    subLocality: z.string().optional(),
    flatNo: z.string().optional(),
    area: z.string().optional(),
    address: z.string().optional(),
    longitude: z.number().optional(),
    latitude: z.number().optional(),
    
    // Size
    carpetArea: z.number().positive().optional(),
    carpetAreaUnit: z.enum(carpetAreaUnitEnum).optional(),
    
    // Basic Details
    category: z.enum(categoryEnum).optional(),
    furnishingStatus: z.enum(furnishingStatusEnum).optional(),
    availabilityStatus: z.enum(availabilityStatusEnum).optional(),
    ageOfProperty: z.enum(ageOfPropertyEnum).optional(),
    
    // Property Details
    numberOfRooms: z.number().int().min(0).optional(),
    numberOfBathrooms: z.number().int().min(0).optional(),
    numberOfBalcony: z.number().int().min(0).optional(),
    numberOfFloors: z.number().int().min(0).optional(),
    propertyFloor: z.string().optional(),
    
    // Price Details
    allInclusivePrice: z.boolean().optional(),
    negotiablePrice: z.boolean().optional(),
    govtChargesTaxIncluded: z.boolean().optional(),
    
    // Other Details
    propertyFacing: z.enum(propertyFacingEnum).optional(),
    amenities: z.array(z.string()).optional(),
    locationAdvantages: z.array(z.string()).optional(),
    coveredParking: z.number().int().min(0).optional(),
    uncoveredParking: z.number().int().min(0).optional(),
});

export const addMediaSchema = z.object({
    media: z.array(
        z.object({
            url: z.string().url(),
            key: z.string(),
            mediaType: z.enum(MediaTypeEnum),
        })
    ).min(1),
});

export const changeStatus = z.object({
    status: z.enum(StatusEnum)
});

// Filter Properties Schema
export const filterPropertiesSchema = z.object({
    // Property Category (can select multiple)
    category: z.preprocess(
        (val) => val ? (Array.isArray(val) ? val : [val]) : undefined,
        z.array(z.enum(categoryEnum)).optional()
    ),
    
    // Property Type (can select multiple)
    propertyType: z.preprocess(
        (val) => val ? (Array.isArray(val) ? val : [val]) : undefined,
        z.array(z.enum(propertyTypeEnum)).optional()
    ),
    
    // Furnishing Status (can select multiple)
    furnishingStatus: z.preprocess(
        (val) => val ? (Array.isArray(val) ? val : [val]) : undefined,
        z.array(z.enum(furnishingStatusEnum)).optional()
    ),
    
    // Price Range
    priceMin: z.preprocess(
        (val) => val ? parseFloat(val as string) : undefined,
        z.number().positive().optional()
    ),
    priceMax: z.preprocess(
        (val) => val ? parseFloat(val as string) : undefined,
        z.number().positive().optional()
    ),
    
    // Location Filters
    state: z.string().optional(),
    city: z.string().optional(),
    locality: z.string().optional(),
    
    // Additional Filters
    availabilityStatus: z.preprocess(
        (val) => val ? (Array.isArray(val) ? val : [val]) : undefined,
        z.array(z.enum(availabilityStatusEnum)).optional()
    ),
    
    ageOfProperty: z.preprocess(
        (val) => val ? (Array.isArray(val) ? val : [val]) : undefined,
        z.array(z.enum(ageOfPropertyEnum)).optional()
    ),
    
    numberOfRooms: z.preprocess(
        (val) => val ? parseInt(val as string) : undefined,
        z.number().int().min(0).optional()
    ),
    numberOfBathrooms: z.preprocess(
        (val) => val ? parseInt(val as string) : undefined,
        z.number().int().min(0).optional()
    ),
    
    propertyFacing: z.preprocess(
        (val) => val ? (Array.isArray(val) ? val : [val]) : undefined,
        z.array(z.enum(propertyFacingEnum)).optional()
    ),
    
    // Carpet Area filters
    carpetAreaMin: z.preprocess(
        (val) => val ? parseFloat(val as string) : undefined,
        z.number().positive().optional()
    ),
    carpetAreaMax: z.preprocess(
        (val) => val ? parseFloat(val as string) : undefined,
        z.number().positive().optional()
    ),
    carpetAreaUnit: z.enum(carpetAreaUnitEnum).optional(),
    
    // Sorting
    sortBy: z.enum(['price_asc', 'price_desc', 'created_desc', 'created_asc']).default('created_desc'),
    
    // Pagination
    page: z.preprocess(
        (val) => val ? parseInt(val as string) : 1,
        z.number().int().min(1).default(1)
    ),
    limit: z.preprocess(
        (val) => val ? Math.min(parseInt(val as string), 100) : 10,
        z.number().int().min(1).max(100).default(10)
    ),
});

// Search Properties Schema
export const searchPropertiesSchema = z.object({
    // Search query for title
    query: z.string().optional(),
    
    // Location search
    state: z.string().optional(),
    city: z.string().optional(),
    locality: z.string().optional(),
    subLocality: z.string().optional(),
    area: z.string().optional(),
    
    // Sorting
    sortBy: z.enum(['price_asc', 'price_desc', 'created_desc', 'created_asc']).default('created_desc'),
    
    // Pagination
    page: z.preprocess(
        (val) => val ? parseInt(val as string) : 1,
        z.number().int().min(1).default(1)
    ),
    limit: z.preprocess(
        (val) => val ? Math.min(parseInt(val as string), 100) : 10,
        z.number().int().min(1).max(100).default(10)
    ),
});

export type addPropertyInput = z.infer<typeof addPropertySchema>;
export type addDraftPropertyInput = z.infer<typeof addDraftPropertySchema>;
export type updatePropertyInput = z.infer<typeof updatePropertySchema>;
export type addMediaInput = z.infer<typeof addMediaSchema>;
export type filterPropertiesInput = z.infer<typeof filterPropertiesSchema>;
export type searchPropertiesInput = z.infer<typeof searchPropertiesSchema>;
