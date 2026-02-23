export type BannerStatus = "Active" | "Inactive" | "Completed" | "Pending"

export type Banner = {
    id: string
    image: string
    status: BannerStatus
    date: string
    time: string
}
