export const categoryEnum = ["RESIDENTIAL", "COMMERCIAL", "AGRICULTURAL"] as const;
export type PropertyCategory = (typeof categoryEnum)[number];

export const propertyCategoryTypeLabels = [
    {
        category: "RESIDENTIAL" as const,
        types: [
            "Apartment / Flat",
            "Independent House / Villa",
            "Plot / Land",
            "Farmhouse",
        ],
    },
    {
        category: "COMMERCIAL" as const,
        types: [
            "Office Space",
            "Shop / Showroom",
            "Commercial Plot / Land",
            "Warehouse / Godown",
        ],
    },
    {
        category: "AGRICULTURAL" as const,
        types: ["Agricultural / Farm Land"],
    },
] as const;

const categoryAliasMap: Record<string, PropertyCategory> = {
    RESIDENTIAL: "RESIDENTIAL",
    COMMERCIAL: "COMMERCIAL",
    AGRICULTURAL: "AGRICULTURAL",
};

function normalizeLookupKey(value: unknown): string | undefined {
    if (typeof value !== "string") return undefined;
    const normalized = value.trim().replace(/\s+/g, " ").toUpperCase();
    return normalized.length > 0 ? normalized : undefined;
}

function inferCategoryFromKeywords(key: string): PropertyCategory | undefined {
    if (key.includes("COMMERCIAL") || key.includes("OFFICE") || key.includes("SHOP") || key.includes("SHOWROOM")) {
        return "COMMERCIAL";
    }
    if (key.includes("AGRIC") || key.includes("FARM")) {
        return "AGRICULTURAL";
    }
    if (key.includes("RESIDENT") || key.includes("HOME") || key.includes("HOUSE") || key.includes("VILLA") || key.includes("FLAT") || key.includes("APARTMENT")) {
        return "RESIDENTIAL";
    }
    return undefined;
}

export function normalizeCategory(value: unknown): PropertyCategory | undefined {
    const key = normalizeLookupKey(value);
    if (!key) return undefined;
    return categoryAliasMap[key] ?? inferCategoryFromKeywords(key);
}

export function normalizeCategoryArray(value: unknown): unknown {
    if (!value) return undefined;
    const list = Array.isArray(value) ? value : [value];
    return list.map((item) => normalizeCategory(item) ?? item);
}