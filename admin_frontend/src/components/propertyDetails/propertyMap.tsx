"use client"

import { useRef, useMemo } from "react"
import { useJsApiLoader, GoogleMap } from "@react-google-maps/api"
import { MapPin } from "lucide-react"

const mapContainerStyle = { width: "100%", height: "280px", borderRadius: "0.5rem" }
const defaultCenter = { lat: 23.2599, lng: 77.4126 } // Bhopal fallback
/** mapId required for AdvancedMarkerElement. Use DEMO_MAP_ID for testing, or create your own in Cloud Console. */
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"

interface PropertyMapProps {
    latitude: number | null
    longitude: number | null
    /** Optional label, e.g. property title */
    title?: string
}

export function PropertyMap({ latitude, longitude, title }: PropertyMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey,
        libraries: ["marker"],
    })

    const center = useMemo(() => {
        if (latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude)) {
            return { lat: latitude, lng: longitude }
        }
        return defaultCenter
    }, [latitude, longitude])

    const hasValidCoords = latitude != null && longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude)

    const handleLoad = async (map: google.maps.Map) => {
        if (!hasValidCoords) return
        try {
            const { AdvancedMarkerElement } = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary
            const marker = new AdvancedMarkerElement({ map, position: center, title })
            markerRef.current = marker
        } catch (e) {
            console.warn("AdvancedMarkerElement failed, map still works:", e)
        }
    }

    const handleUnmount = () => {
        if (markerRef.current) {
            markerRef.current.map = null
            markerRef.current = null
        }
    }

    if (!apiKey) {
        return (
            <div className="mt-5 border rounded-xl p-4 bg-gray-50">
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                    <MapPin className="size-4 text-gray-600" />
                    Map
                </h3>
                <p className="text-sm text-gray-500">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map.</p>
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="mt-5 border rounded-xl p-4 bg-gray-50">
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                    <MapPin className="size-4 text-gray-600" />
                    Map
                </h3>
                <p className="text-sm text-red-500">Failed to load Google Maps.</p>
                <p className="text-xs text-gray-500 mt-2">
                    InvalidKeyMapError? Ensure billing is enabled, Maps JavaScript API is enabled, and your API key allows your domain. See{" "}
                    <a href="https://developers.google.com/maps/documentation/javascript/error-messages#invalid-key-map-error" target="_blank" rel="noopener noreferrer" className="underline">
                        troubleshooting
                    </a>
                    .
                </p>
            </div>
        )
    }

    if (!isLoaded) {
        return (
            <div className="mt-5 border rounded-xl p-4 bg-gray-50">
                <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                    <MapPin className="size-4 text-gray-600" />
                    Map
                </h3>
                <div className="h-70 rounded-lg bg-gray-200 animate-pulse flex items-center justify-center">
                    <span className="text-sm text-gray-500">Loading map...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="mt-5 border rounded-xl p-4">
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <MapPin className="size-4 text-gray-600" />
                Map
            </h3>
            <div className="overflow-hidden rounded-lg border border-gray-200">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={15}
                    onLoad={handleLoad}
                    onUnmount={handleUnmount}
                    options={{
                        mapId: MAP_ID,
                        disableDefaultUI: false,
                        zoomControl: true,
                        mapTypeControl: true,
                        streetViewControl: false,
                        fullscreenControl: true,
                    }}
                />
            </div>
        </div>
    )
}
