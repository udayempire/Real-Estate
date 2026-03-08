import { api } from "@/lib/api";

type BookmarksResponse = {
    message: string;
    data: Array<{
        id: string;
        property: {
            id: string;
            title: string;
            status: string;
        };
    }>;
};

export async function fetchBookmarkedPropertyIds(): Promise<Set<string>> {
    const response = await api.get<BookmarksResponse>("/staff/properties/bookmarks");
    const ids = (response.data.data ?? []).map((item) => item.property.id);
    return new Set(ids);
}

export async function addBookmark(propertyId: string) {
    return api.post("/staff/properties/bookmark", { propertyId });
}

export async function removeBookmark(propertyId: string) {
    return api.delete("/staff/properties/bookmark", { data: { propertyId } });
}

export async function toggleBookmark(propertyId: string, isBookmarked: boolean) {
    if (isBookmarked) {
        await removeBookmark(propertyId);
        return false;
    }
    await addBookmark(propertyId);
    return true;
}
