"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api"
import { useRouter } from "next/navigation"
import { Building2 } from "lucide-react"

import { api } from "@/lib/api"

type StaffProperty = {
	id: string
	title: string
	latitude: number | null
	longitude: number | null
}

type StaffPropertyListResponse = {
	success: boolean
	data: StaffProperty[]
}

type MarkerPoint = {
	id: string
	title: string
	lat: number
	lng: number
}

const mapContainerStyle = { width: "100%", height: "460px", borderRadius: "0.75rem" }
const indiaCenter = { lat: 22.9734, lng: 78.6569 }
const buildingMarkerIcon = "https://maps.google.com/mapfiles/kml/shapes/homegardenbusiness.png"

export function UserListingsMaps() {
	const router = useRouter()
	const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""

	const { isLoaded, loadError } = useJsApiLoader({
		googleMapsApiKey: apiKey,
		libraries: ["marker"],
	})

	const { data, isLoading, isError } = useQuery({
		queryKey: ["dashboard", "properties-map-all"],
		queryFn: async () => {
			const [userListingsResponse, exclusiveListingsResponse] = await Promise.all([
				api.get<StaffPropertyListResponse>("/staff/properties?limit=300&page=1"),
				api.get<StaffPropertyListResponse>("/staff/properties/exclusive?limit=300&page=1"),
			])

			return [...userListingsResponse.data.data, ...exclusiveListingsResponse.data.data]
		},
		staleTime: 2 * 60 * 1000,
	})

	const points = useMemo<MarkerPoint[]>(() => {
		if (!data?.length) return []
		return data
			.filter((property) => Number.isFinite(property.latitude) && Number.isFinite(property.longitude))
			.map((property) => ({
				id: property.id,
				title: property.title,
				lat: Number(property.latitude),
				lng: Number(property.longitude),
			}))
	}, [data])

	if (!apiKey) {
		return (
			<div className="rounded-xl border bg-white p-4">
				<h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
					<Building2 className="size-4 text-blue-600" />
					Properties Map
				</h3>
				<p className="text-sm text-muted-foreground">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable map view.</p>
			</div>
		)
	}

	if (loadError || isError) {
		return (
			<div className="rounded-xl border bg-white p-4">
				<h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
					<Building2 className="size-4 text-blue-600" />
					Properties Map
				</h3>
				<p className="text-sm text-red-500">Failed to load properties map.</p>
			</div>
		)
	}

	return (
		<div className="rounded-xl border bg-white p-4">
			<div className="mb-3 flex items-center justify-between">
				<h3 className="flex items-center gap-2 text-sm font-semibold">
					<Building2 className="size-4 text-blue-600" />
					All Properties Across India
				</h3>
				<p className="text-xs text-muted-foreground">{points.length} mapped properties</p>
			</div>

			{!isLoaded || isLoading ? (
				<div className="h-115 animate-pulse rounded-xl bg-slate-100" />
			) : points.length === 0 ? (
				<div className="flex h-115 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
					No properties with valid latitude/longitude found.
				</div>
			) : (
				<div className="overflow-hidden rounded-xl border">
					<GoogleMap
						mapContainerStyle={mapContainerStyle}
						center={indiaCenter}
						zoom={4}
						options={{
							zoomControl: true,
							streetViewControl: false,
							fullscreenControl: true,
							mapTypeControl: true,
						}}
					>
						{points.map((point) => (
							<MarkerF
								key={point.id}
								position={{ lat: point.lat, lng: point.lng }}
								title={point.title}
								icon={buildingMarkerIcon}
								onClick={() => router.push(`/property/${point.id}`)}
							/>
						))}
					</GoogleMap>
				</div>
			)}
		</div>
	)
}

