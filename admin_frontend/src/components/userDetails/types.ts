export type PropertyStatus = "ACTIVE" | "UNLISTED" | "SOLDTOREALBRO" | "SOLDEXCLUSIVEPROPERTY" | "SOLDOFFLINE" | "SOLDFROMLISTINGS" | "DRAFT"

export type PropertyListing = {
    id: string
    title: string
    status: PropertyStatus
    listingPrice: number | null
    createdAt: string
    state: string | null
    city: string | null
    locality: string | null
    carpetArea: number | null
    carpetAreaUnit: string | null
    plotLandArea: number | null
    plotLandAreaUnit: string | null
    media: { url: string }[]
}

export type PropertiesByStatus = {
    all: PropertyListing[]
    active: PropertyListing[]
    unlisted: PropertyListing[]
    soldToRealBro: PropertyListing[]
    soldFromExclusive: PropertyListing[]
}

export type UserStats = {
    totalGems: number
    totalProperties: number
    soldToRealBro: number
    totalPropertiesWorth: number
}

export type KycItem = {
    type: "AADHARCARD" | "PANCARD"
    status: "PENDING" | "VERIFIED" | "REJECTED"
}

export type FullUserData = {
    id: string
    firstName: string
    lastName: string
    avatar: string | null
    avatarKey: string | null
    age: number | null
    gender: string | null
    referralCode: string
    referrerId: string | null
    email: string
    phone: string
    isBlocked: boolean
    blockedBy: string | null
    blockedOn: string | null
    points: number
    isEmailVerified: boolean
    createdAt: string
    updatedAt: string
    kyc: KycItem[]
    userStats: UserStats
    properties_by_status: PropertiesByStatus
}
